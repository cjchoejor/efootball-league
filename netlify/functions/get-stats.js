const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    const { type, tournament_id, limit } = event.queryStringParameters || {};
    
    try {
        const sql = neon();
        
        if (type === 'tournament') {
            return await getTournamentStats(sql, tournament_id, limit);
        } else if (type === 'all-time') {
            return await getAllTimeStats(sql, limit);
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

async function getTournamentStats(sql, tournamentId, limit) {
    try {
        console.log('getTournamentStats called with:', { tournamentId, limit });
        
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
                    THEN ROUND(CAST(ts.wins AS FLOAT) / ts.games_played * 100, 1)
                    ELSE 0 
                END as win_percentage,
                COALESCE(ts.goals_scored, 0) - COALESCE(ts.goals_conceded, 0) as goal_difference
            FROM tournament_players tp
            JOIN players p ON tp.player_id = p.id
            LEFT JOIN tournament_stats ts ON ts.tournament_id = $1 AND ts.player_id = p.id
            WHERE tp.tournament_id = $2
            ORDER BY COALESCE(ts.points, 0) DESC, COALESCE(ts.goals_scored, 0) DESC
        `;
        
        const params = [tournamentId, tournamentId];
        
        if (limit) {
            query += ` LIMIT $3`;
            params.push(parseInt(limit));
        }
        
        console.log('Executing query with params:', params);
        const stats = await sql(query, params);
        console.log('Query result:', stats);
        
        return {
            statusCode: 200,
            body: JSON.stringify(stats)
        };
    } catch (error) {
        console.error('Error in getTournamentStats:', error.message);
        throw error;
    }
}

async function getAllTimeStats(sql, limit) {
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
                THEN ROUND(CAST(ats.total_wins AS FLOAT) / ats.total_matches * 100, 1)
                ELSE 0 
            END as win_percentage,
            COALESCE(ats.total_points, 0) as total_points
        FROM players p
        LEFT JOIN all_time_stats ats ON ats.player_id = p.id
        WHERE EXISTS (SELECT 1 FROM all_time_stats WHERE player_id = p.id)
        ORDER BY COALESCE(ats.total_points, 0) DESC, COALESCE(ats.total_goals, 0) DESC
    `;
    
    const params = [];
    
    if (limit) {
        query += ` LIMIT $1`;
        params.push(parseInt(limit));
    }
    
    const stats = await sql(query, params);
    
    return {
        statusCode: 200,
        body: JSON.stringify(stats)
    };
}
