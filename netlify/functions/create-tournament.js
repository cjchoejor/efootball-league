const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const sql = neon();
        const { playerIds, matchesPerPlayer } = JSON.parse(event.body);
        
        // Get the maximum week number from existing tournaments
        // This ensures sequential naming: WEEK 01, WEEK 02, WEEK 03, etc.
        const maxWeekResult = await sql(`
            SELECT MAX(CAST(REPLACE(name, 'WEEK ', '') AS INTEGER)) as max_week 
            FROM tournaments 
            WHERE name LIKE 'WEEK%'
        `);
        
        let tournamentNumber = 1;
        if (maxWeekResult && maxWeekResult[0] && maxWeekResult[0].max_week) {
            tournamentNumber = maxWeekResult[0].max_week + 1;
        }
        
        const tournamentName = `WEEK ${String(tournamentNumber).padStart(2, '0')}`;
        const tournamentId = `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('New tournament number:', tournamentNumber, 'Name:', tournamentName, 'ID:', tournamentId);
        
        // Create tournament
        await sql(
            'INSERT INTO tournaments (id, name, matches_per_player) VALUES ($1, $2, $3)',
            [tournamentId, tournamentName, matchesPerPlayer]
        );
        
        // Add players to tournament (they already exist in players table)
        console.log('Adding ' + playerIds.length + ' players to tournament');
        const players = [];
        for (const playerId of playerIds) {
            console.log('Adding player to tournament:', tournamentId, playerId);
            
            // Fetch player details
            const playerData = await sql(
                'SELECT id, name, team_name FROM players WHERE id = $1',
                [playerId]
            );
            
            if (playerData && playerData.length > 0) {
                players.push(playerData[0]);
                
                // Add to tournament_players
                await sql(
                    'INSERT INTO tournament_players (tournament_id, player_id) VALUES ($1, $2)',
                    [tournamentId, playerId]
                );
            } else {
                console.warn('Player not found:', playerId);
            }
        }
        console.log('Finished adding all players');
        
        // Generate fixtures
        await generateFixtures(sql, tournamentId, players, matchesPerPlayer);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ tournamentId, name: tournamentName })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function generateFixtures(sql, tournamentId, players, matchesPerPlayer) {
    const matchesPerPair = calculateMatchesPerPair(players.length, matchesPerPlayer);
    
    // Initialize tournament stats for each player
    for (const player of players) {
        await sql(
            'INSERT INTO tournament_stats (tournament_id, player_id, games_played, wins, draws, losses, goals_scored, goals_conceded, points) VALUES ($1, $2, 0, 0, 0, 0, 0, 0, 0) ON CONFLICT (tournament_id, player_id) DO NOTHING',
            [tournamentId, player.id]
        );
    }
    
    // Generate bidirectional fixtures
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            for (let k = 0; k < matchesPerPair; k++) {
                // Match: Player i vs Player j
                const matchId1 = `match_${tournamentId}_${i}_${j}_${k}`;
                await sql(
                    'INSERT INTO matches (id, tournament_id, player_a_id, player_b_id, status, league_status) VALUES ($1, $2, $3, $4, $5, $6)',
                    [matchId1, tournamentId, players[i].id, players[j].id, 'scheduled', 'ongoing']
                );
                
                // Reverse match: Player j vs Player i
                const matchId2 = `match_${tournamentId}_${j}_${i}_${k}`;
                await sql(
                    'INSERT INTO matches (id, tournament_id, player_a_id, player_b_id, status, league_status) VALUES ($1, $2, $3, $4, $5, $6)',
                    [matchId2, tournamentId, players[j].id, players[i].id, 'scheduled', 'ongoing']
                );
            }
        }
    }
}

function calculateMatchesPerPair(playerCount, totalMatches) {
    const possiblePairs = (playerCount * (playerCount - 1)) / 2;
    return Math.floor(totalMatches / possiblePairs);
}
