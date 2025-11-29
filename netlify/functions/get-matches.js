const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    const { tournament_id, status, limit } = event.queryStringParameters || {};
    
    try {
        const sql = neon();
        
        let query = `
            SELECT 
                m.id,
                m.tournament_id,
                m.player_a_id,
                m.player_b_id,
                m.goals_a,
                m.goals_b,
                m.status,
                m.match_date,
                pa.name as player_a_name,
                pa.team_name as team_a,
                pb.name as player_b_name,
                pb.team_name as team_b
            FROM matches m
            JOIN players pa ON m.player_a_id = pa.id
            JOIN players pb ON m.player_b_id = pb.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (tournament_id) {
            query += ` AND m.tournament_id = $${paramCount}`;
            params.push(tournament_id);
            paramCount++;
        }
        
        if (status) {
            query += ` AND m.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        query += ` ORDER BY m.match_date DESC`;
        
        if (limit) {
            query += ` LIMIT $${paramCount}`;
            params.push(parseInt(limit));
        }
        
        const matches = await sql(query, params);
        
        return {
            statusCode: 200,
            body: JSON.stringify(matches)
        };
    } catch (error) {
        console.error('Error in get-matches:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
