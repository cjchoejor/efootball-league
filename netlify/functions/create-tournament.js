const { db } = require('@netlify/functions');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { players, matchesPerPlayer } = JSON.parse(event.body);
        
        // Get tournament count for naming
        const { data: tournaments } = await db.query(
            'SELECT COUNT(*) as count FROM tournaments'
        );
        
        const tournamentName = `WEEK ${tournaments[0].count + 1}`;
        const tournamentId = `tournament_${Date.now()}`;
        
        // Create tournament
        await db.query(
            'INSERT INTO tournaments (id, name, matches_per_player) VALUES (?, ?, ?)',
            [tournamentId, tournamentName, matchesPerPlayer]
        );
        
        // Add players and create fixtures
        for (const player of players) {
            await db.query(
                'INSERT OR IGNORE INTO players (id, name, team_name, photo_url) VALUES (?, ?, ?, ?)',
                [player.id, player.name, player.teamName, player.photoUrl]
            );
            
            await db.query(
                'INSERT INTO tournament_players (tournament_id, player_id) VALUES (?, ?)',
                [tournamentId, player.id]
            );
        }
        
        // Generate fixtures
        await generateFixtures(tournamentId, players, matchesPerPlayer);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ tournamentId, name: tournamentName })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function generateFixtures(tournamentId, players, matchesPerPlayer) {
    const { db } = require('@netlify/functions');
    const matchesPerPair = calculateMatchesPerPair(players.length, matchesPerPlayer);
    
    // Initialize tournament stats for each player
    for (const player of players) {
        await db.query(
            'INSERT OR IGNORE INTO tournament_stats (tournament_id, player_id, games_played, wins, draws, losses, goals_scored, goals_conceded, points) VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0)',
            [tournamentId, player.id]
        );
    }
    
    // Generate bidirectional fixtures
    for (let i = 0; i < players.length; i++) {
        for (let j = i + 1; j < players.length; j++) {
            for (let k = 0; k < matchesPerPair; k++) {
                // Match: Player i vs Player j
                const matchId1 = `match_${tournamentId}_${i}_${j}_${k}`;
                await db.query(
                    'INSERT INTO matches (id, tournament_id, player_a_id, player_b_id, status) VALUES (?, ?, ?, ?, ?)',
                    [matchId1, tournamentId, players[i].id, players[j].id, 'scheduled']
                );
                
                // Reverse match: Player j vs Player i
                const matchId2 = `match_${tournamentId}_${j}_${i}_${k}`;
                await db.query(
                    'INSERT INTO matches (id, tournament_id, player_a_id, player_b_id, status) VALUES (?, ?, ?, ?, ?)',
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