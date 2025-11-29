const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    const { id, status, limit } = event.queryStringParameters || {};
    
    try {
        const sql = neon();
        
        let query = `
            SELECT t.*, 
                   COUNT(DISTINCT tp.player_id) as player_count,
                   COUNT(DISTINCT m.id) as total_matches,
                   COUNT(DISTINCT CASE WHEN m.status IN ('completed', 'finished') THEN m.id END) as completed_matches
            FROM tournaments t
            LEFT JOIN tournament_players tp ON t.id = tp.tournament_id
            LEFT JOIN matches m ON t.id = m.tournament_id
        `;
        
        const params = [];
        let paramCount = 1;
        let hasWhere = false;
        
        if (id) {
            query += ` WHERE t.id = $${paramCount}`;
            params.push(id);
            paramCount++;
            hasWhere = true;
        }
        
        if (status) {
            query += hasWhere ? ` AND` : ` WHERE`;
            query += ` t.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        
        query += ` GROUP BY t.id ORDER BY t.created_at DESC`;
        
        if (limit) {
            query += ` LIMIT $${paramCount}`;
            params.push(parseInt(limit));
        }
        
        const tournaments = await sql(query, params);
        
        return {
            statusCode: 200,
            body: JSON.stringify(tournaments)
        };
    } catch (error) {
        console.error('Error in get-tournaments:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
