const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const sql = neon();
        const { players, matchesPerPlayer } = JSON.parse(event.body);
        
        // Get tournament count for naming (count all tournaments regardless of status)
        // This gives us sequential naming: WEEK 1, WEEK 2, WEEK 3, etc.
        const countResult = await sql('SELECT COUNT(*) as count FROM tournaments');
        const tournamentNumber = countResult && countResult[0] ? countResult[0].count + 1 : 1;
        const tournamentName = `WEEK ${tournamentNumber}`;
        console.log('Tournament count result:', countResult, 'Tournament number:', tournamentNumber, 'Generated name:', tournamentName);
        const tournamentId = `tournament_${Date.now()}`;
        
        // Create tournament
        await sql(
            'INSERT INTO tournaments (id, name, matches_per_player) VALUES ($1, $2, $3)',
            [tournamentId, tournamentName, matchesPerPlayer]
        );
        
        // Add players and create fixtures
        for (const player of players) {
            await sql(
                'INSERT INTO players (id, name, team_name, photo_url) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                [player.id, player.name, player.teamName, player.photoUrl]
            );
            
            await sql(
                'INSERT INTO tournament_players (tournament_id, player_id) VALUES ($1, $2)',
                [tournamentId, player.id]
            );
        }
        
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
                    'INSERT INTO matches (id, tournament_id, player_a_id, player_b_id, status) VALUES ($1, $2, $3, $4, $5)',
                    [matchId1, tournamentId, players[i].id, players[j].id, 'scheduled']
                );
                
                // Reverse match: Player j vs Player i
                const matchId2 = `match_${tournamentId}_${j}_${i}_${k}`;
                await sql(
                    'INSERT INTO matches (id, tournament_id, player_a_id, player_b_id, status) VALUES ($1, $2, $3, $4, $5)',
                    [matchId2, tournamentId, players[j].id, players[i].id, 'scheduled']
                );
            }
        }
    }
}

function calculateMatchesPerPair(playerCount, totalMatches) {
    const possiblePairs = (playerCount * (playerCount - 1)) / 2;
    return Math.floor(totalMatches / possiblePairs);
}
