const { db } = require('@netlify/functions');

exports.handler = async (event) => {
    const { id, status, limit } = event.queryStringParameters || {};
    
    try {
        let query = `
            SELECT t.*, 
                   COUNT(DISTINCT tp.player_id) as player_count,
                   COUNT(DISTINCT m.id) as total_matches,
                   COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) as completed_matches
            FROM tournaments t
            LEFT JOIN tournament_players tp ON t.id = tp.tournament_id
            LEFT JOIN matches m ON t.id = m.tournament_id
        `;
        
        const params = [];
        let hasWhere = false;
        
        if (id) {
            query += ' WHERE t.id = ?';
            params.push(id);
            hasWhere = true;
        }
        
        if (status) {
            query += hasWhere ? ' AND' : ' WHERE';
            query += ' t.status = ?';
            params.push(status);
        }
        
        query += ' GROUP BY t.id ORDER BY t.created_at DESC';
        
        if (limit) {
            query += ' LIMIT ?';
            params.push(parseInt(limit));
        }
        
        const { data: tournaments } = await db.query(query, params);
        
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