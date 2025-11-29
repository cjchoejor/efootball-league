const { NetlifyDB } = require('@netlify/functions');

async function updateTournamentStats(db, tournamentId, playerId, goalsFor, goalsAgainst, isWin, isDraw) {
    const points = isWin ? 3 : isDraw ? 1 : 0;
    
    await db.query(`
        UPDATE tournament_stats SET 
            games_played = games_played + 1,
            wins = wins + ?,
            draws = draws + ?,
            losses = losses + ?,
            goals_scored = goals_scored + ?,
            goals_conceded = goals_conceded + ?,
            points = points + ?
        WHERE tournament_id = ? AND player_id = ?
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

async function updateAllTimeStats(db, playerId, goalsFor, goalsAgainst, isWin, isDraw, teamName) {
    const points = isWin ? 3 : isDraw ? 1 : 0;
    
    // Update or insert all-time stats
    await db.query(`
        INSERT INTO all_time_stats (player_id, total_goals, total_matches, total_wins, total_draws, total_losses, total_points, tournaments_played, best_team)
        VALUES (?, ?, 1, ?, ?, ?, ?, 1, ?)
        ON CONFLICT(player_id) DO UPDATE SET
            total_goals = total_goals + ?,
            total_matches = total_matches + 1,
            total_wins = total_wins + ?,
            total_draws = total_draws + ?,
            total_losses = total_losses + ?,
            total_points = total_points + ?,
            best_team = ?
    `, [
        playerId, goalsFor, isWin ? 1 : 0, isDraw ? 1 : 0, (!isWin && !isDraw) ? 1 : 0, points, teamName,
        goalsFor, isWin ? 1 : 0, isDraw ? 1 : 0, (!isWin && !isDraw) ? 1 : 0, points, teamName
    ]);

    // Update biggest win if applicable
    if (isWin && (goalsFor - goalsAgainst) > 0) {
        const winString = `${goalsFor}-${goalsAgainst}`;
        await db.query(`
            UPDATE all_time_stats SET biggest_win = ?
            WHERE player_id = ? AND (biggest_win IS NULL OR 
                CAST(SUBSTR(biggest_win, 1, INSTR(biggest_win, '-') - 1) AS INTEGER) - 
                CAST(SUBSTR(biggest_win, INSTR(biggest_win, '-') + 1) AS INTEGER) < ?)
        `, [winString, playerId, goalsFor - goalsAgainst]);
    }
}

async function checkAndCompleteTournament(db, tournamentId) {
    // Count remaining scheduled matches
    const remaining = await db.query(
        'SELECT COUNT(*) as count FROM matches WHERE tournament_id = ? AND status = ?',
        [tournamentId, 'scheduled']
    );
    
    if (remaining[0].count === 0) {
        // All matches completed, mark tournament as completed
        await db.query(
            'UPDATE tournaments SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['completed', tournamentId]
        );
        
        // Update tournament won count for players with highest points
        const leaderboard = await db.query(`
            SELECT player_id, points FROM tournament_stats 
            WHERE tournament_id = ? 
            ORDER BY points DESC 
            LIMIT 1
        `, [tournamentId]);
        
        if (leaderboard.length > 0) {
            const winnerId = leaderboard[0].player_id;
            await db.query(
                'UPDATE all_time_stats SET tournaments_won = tournaments_won + 1 WHERE player_id = ?',
                [winnerId]
            );
        }
    }
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const db = new NetlifyDB();
        const { matchId, goalsA, goalsB } = JSON.parse(event.body);
        
        // Update match
        await db.query(
            'UPDATE matches SET goals_a = ?, goals_b = ?, status = ? WHERE id = ?',
            [goalsA, goalsB, 'completed', matchId]
        );
        
        // Get match details for stats update
        const match = await db.query(`
            SELECT m.tournament_id, m.player_a_id, m.player_b_id, 
                   pa.team_name as team_a, pb.team_name as team_b
            FROM matches m
            JOIN players pa ON m.player_a_id = pa.id
            JOIN players pb ON m.player_b_id = pb.id
            WHERE m.id = ?
        `, [matchId]);
        
        if (match.length > 0) {
            const { tournament_id, player_a_id, player_b_id, team_a, team_b } = match[0];
            
            const isWinA = goalsA > goalsB;
            const isDraw = goalsA === goalsB;
            const isWinB = goalsB > goalsA;
            
            // Update tournament stats for both players
            await updateTournamentStats(db, tournament_id, player_a_id, goalsA, goalsB, isWinA, isDraw);
            await updateTournamentStats(db, tournament_id, player_b_id, goalsB, goalsA, isWinB, isDraw);
            
            // Update all-time stats for both players
            await updateAllTimeStats(db, player_a_id, goalsA, goalsB, isWinA, isDraw, team_a);
            await updateAllTimeStats(db, player_b_id, goalsB, goalsA, isWinB, isDraw, team_b);
            
            // Check if tournament is complete
            await checkAndCompleteTournament(db, tournament_id);
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
