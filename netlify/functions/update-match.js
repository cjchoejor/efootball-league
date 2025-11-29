const { neon } = require('@netlify/neon');

async function updateTournamentStats(sql, tournamentId, playerId, goalsFor, goalsAgainst, isWin, isDraw) {
    const points = isWin ? 3 : isDraw ? 1 : 0;
    
    await sql(`
        UPDATE tournament_stats SET 
            games_played = games_played + 1,
            wins = wins + $1,
            draws = draws + $2,
            losses = losses + $3,
            goals_scored = goals_scored + $4,
            goals_conceded = goals_conceded + $5,
            points = points + $6
        WHERE tournament_id = $7 AND player_id = $8
    `, [
        isWin ? 1 : 0,
        isDraw ? 1 : 0,
        (!isWin && !isDraw) ? 1 : 0,
        goalsFor,
        goalsAgainst,
        points,
        tournamentId,
        playerId
    ]);
}

async function updateAllTimeStats(sql, playerId, goalsFor, goalsAgainst, isWin, isDraw, teamName) {
    const points = isWin ? 3 : isDraw ? 1 : 0;
    
    // Update or insert all-time stats
    await sql(`
        INSERT INTO all_time_stats (player_id, total_goals, total_matches, total_wins, total_draws, total_losses, total_points, tournaments_played, best_team)
        VALUES ($1, $2, 1, $3, $4, $5, $6, 1, $7)
        ON CONFLICT (player_id) DO UPDATE SET
            total_goals = all_time_stats.total_goals + $2,
            total_matches = all_time_stats.total_matches + 1,
            total_wins = all_time_stats.total_wins + $3,
            total_draws = all_time_stats.total_draws + $4,
            total_losses = all_time_stats.total_losses + $5,
            total_points = all_time_stats.total_points + $6,
            best_team = $7
    `, [
        playerId, 
        goalsFor, 
        isWin ? 1 : 0, 
        isDraw ? 1 : 0, 
        (!isWin && !isDraw) ? 1 : 0, 
        points, 
        teamName
    ]);

    // Update biggest win if applicable
    if (isWin && (goalsFor - goalsAgainst) > 0) {
        const winString = `${goalsFor}-${goalsAgainst}`;
        const goalDiff = goalsFor - goalsAgainst;
        
        await sql(`
            UPDATE all_time_stats SET biggest_win = $1
            WHERE player_id = $2 AND (biggest_win IS NULL OR 
                CAST(SPLIT_PART(biggest_win, '-', 1) AS INTEGER) - 
                CAST(SPLIT_PART(biggest_win, '-', 2) AS INTEGER) < $3)
        `, [winString, playerId, goalDiff]);
    }
}

async function checkAndCompleteTournament(sql, tournamentId) {
    // Count remaining scheduled matches
    const remaining = await sql(
        'SELECT COUNT(*) as count FROM matches WHERE tournament_id = $1 AND status = $2',
        [tournamentId, 'scheduled']
    );
    
    if (remaining[0].count === 0) {
        // All matches completed, mark tournament as finished
        await sql(
            'UPDATE tournaments SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['finished', tournamentId]
        );
        console.log('Tournament ' + tournamentId + ' marked as finished');
        
        // Update tournament won count for players with highest points
        const leaderboard = await sql(`
            SELECT player_id, points FROM tournament_stats 
            WHERE tournament_id = $1 
            ORDER BY points DESC 
            LIMIT 1
        `, [tournamentId]);
        
        if (leaderboard.length > 0) {
            const winnerId = leaderboard[0].player_id;
            await sql(
                'UPDATE all_time_stats SET tournaments_won = tournaments_won + 1 WHERE player_id = $1',
                [winnerId]
            );
        }
    }
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const sql = neon();
        const { tournamentId, playerAId, playerBId, goalsA, goalsB } = JSON.parse(event.body);
        
        console.log('Update match request:', { tournamentId, playerAId, playerBId, goalsA, goalsB });
        
        // Find first scheduled match between these two players in this tournament
        const matchQuery = `
            SELECT m.id, m.tournament_id, m.player_a_id, m.player_b_id, 
                   pa.team_name as team_a, pb.team_name as team_b
            FROM matches m
            JOIN players pa ON m.player_a_id = pa.id
            JOIN players pb ON m.player_b_id = pb.id
            WHERE m.tournament_id = $1 
              AND m.status = 'scheduled'
              AND ((m.player_a_id = $2 AND m.player_b_id = $3) 
                   OR (m.player_a_id = $3 AND m.player_b_id = $2))
            LIMIT 1
        `;
        
        const matches = await sql(matchQuery, [tournamentId, playerAId, playerBId]);
        
        if (!matches || matches.length === 0) {
            console.log('No scheduled match found, checking if completed matches exist...');
            
            // Check if completed matches exist
            const completedCheck = await sql(`
                SELECT COUNT(*) as count FROM matches 
                WHERE tournament_id = $1 
                  AND status = 'completed'
                  AND ((player_a_id = $2 AND player_b_id = $3) 
                       OR (player_a_id = $3 AND player_b_id = $2))
            `, [tournamentId, playerAId, playerBId]);
            
            if (completedCheck[0].count > 0) {
                console.log('Completed matches found for these players');
                return {
                    statusCode: 409,
                    body: JSON.stringify({ error: `All matches finished with this player` })
                };
            }
            
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'No match found between these players' })
            };
        }
        
        const matchId = matches[0].id;
        console.log('Found match ID:', matchId);
        
        // Update match with goals (swapped: send A's goals to B, B's goals to A)
        await sql(
            'UPDATE matches SET goals_a = $1, goals_b = $2, status = $3 WHERE id = $4',
            [goalsB, goalsA, 'completed', matchId]
        );
        
        console.log('Match updated:', matchId);
        
        // Get match details for stats update
        const match = matches;
        
        if (match.length > 0) {
            const { tournament_id, player_a_id, player_b_id, team_a, team_b } = match[0];
            
            // Goals are swapped: goalsA sent by user goes to playerB, goalsB sent by user goes to playerA
            const isWinA = goalsB > goalsA;
            const isDraw = goalsA === goalsB;
            const isWinB = goalsA > goalsB;
            
            // Update tournament stats for both players (with swapped goals)
            await updateTournamentStats(sql, tournament_id, player_a_id, goalsB, goalsA, isWinA, isDraw);
            await updateTournamentStats(sql, tournament_id, player_b_id, goalsA, goalsB, isWinB, isDraw);
            
            // Update all-time stats for both players (with swapped goals)
            await updateAllTimeStats(sql, player_a_id, goalsB, goalsA, isWinA, isDraw, team_a);
            await updateAllTimeStats(sql, player_b_id, goalsA, goalsB, isWinB, isDraw, team_b);
            
            // Check if tournament is complete
            await checkAndCompleteTournament(sql, tournament_id);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Match updated successfully' })
        };
    } catch (error) {
        console.error('Error in update-match:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
