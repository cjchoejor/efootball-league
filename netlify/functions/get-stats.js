const { db } = require('@netlify/functions');

exports.handler = async (event) => {
    const { type, tournament_id, limit } = event.queryStringParameters || {};
    
    try {
        if (type === 'tournament') {
            // Get stats for a specific tournament
            return await getTournamentStats(tournament_id, limit);
        } else if (type === 'all-time') {
            // Get all-time leaderboard
            return await getAllTimeStats(limit);
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid type parameter' })
            };
        }
    } catch (error) {
        console.error('Error in get-stats:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function getTournamentStats(tournamentId, limit) {
    const { db } = require('@netlify/functions');
    
    let query = `
        SELECT 
            p.id,
            p.name,
            p.team_name,
            p.photo_url,
            COALESCE(ts.games_played, 0) as games_played,
            COALESCE(ts.wins, 0) as wins,
            COALESCE(ts.draws, 0) as draws,
            COALESCE(ts.losses, 0) as losses,
            COALESCE(ts.goals_scored, 0) as goals_scored,
            COALESCE(ts.goals_conceded, 0) as goals_conceded,
            COALESCE(ts.points, 0) as points,
            CASE 
                WHEN COALESCE(ts.games_played, 0) > 0 
                THEN CAST(ts.wins AS FLOAT) / ts.games_played * 100
                ELSE 0 
            END as win_percentage,
            COALESCE(ts.goals_scored, 0) - COALESCE(ts.goals_conceded, 0) as goal_difference
        FROM tournament_players tp
        JOIN players p ON tp.player_id = p.id
        LEFT JOIN tournament_stats ts ON ts.tournament_id = ? AND ts.player_id = p.id
        WHERE tp.tournament_id = ?
        ORDER BY COALESCE(ts.points, 0) DESC, COALESCE(ts.goals_scored, 0) DESC
    `;
    
    if (limit) {
        query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const { data: stats } = await db.query(query, [tournamentId, tournamentId]);
    
    return {
        statusCode: 200,
        body: JSON.stringify(stats)
    };
}

async function getAllTimeStats(limit) {
    const { db } = require('@netlify/functions');
    
    let query = `
        SELECT 
            p.id,
            p.name,
            p.team_name,
            p.photo_url,
            COALESCE(ats.tournaments_played, 0) as tournaments_played,
            COALESCE(ats.tournaments_won, 0) as tournaments_won,
            COALESCE(ats.total_matches, 0) as total_matches,
            COALESCE(ats.total_wins, 0) as total_wins,
            COALESCE(ats.total_draws, 0) as total_draws,
            COALESCE(ats.total_losses, 0) as total_losses,
            COALESCE(ats.total_goals, 0) as total_goals,
            COALESCE(ats.biggest_win, '') as biggest_win,
            COALESCE(ats.best_team, '') as best_team,
            CASE 
                WHEN COALESCE(ats.total_matches, 0) > 0 
                THEN CAST(ats.total_wins AS FLOAT) / ats.total_matches * 100
                ELSE 0 
            END as win_percentage,
            COALESCE(ats.total_points, 0) as total_points
        FROM players p
        LEFT JOIN all_time_stats ats ON ats.player_id = p.id
        WHERE EXISTS (SELECT 1 FROM all_time_stats WHERE player_id = p.id)
        ORDER BY COALESCE(ats.total_points, 0) DESC, COALESCE(ats.total_goals, 0) DESC
    `;
    
    if (limit) {
        query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const { data: stats } = await db.query(query);
    
    return {
        statusCode: 200,
        body: JSON.stringify(stats)
    };
}
