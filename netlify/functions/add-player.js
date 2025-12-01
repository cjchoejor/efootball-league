const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const sql = neon();
        const { name, teamName, accountNumber, photoUrl } = JSON.parse(event.body);
        
        if (!name || !teamName || !accountNumber) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert player with account_number
        await sql(
            `INSERT INTO players (id, name, team_name, account_number, photo_url, created_at)
             VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
            [playerId, name, teamName, accountNumber, photoUrl]
        );

        // Log this action in audit table (optional but recommended for tracking changes)
        await sql(
            `INSERT INTO player_audit (player_id, action, old_values, new_values, changed_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [playerId, 'CREATE', null, JSON.stringify({ name, teamName, accountNumber })]
        );
        
        return {
            statusCode: 200,
            body: JSON.stringify({ playerId, name, teamName, accountNumber })
        };
    } catch (error) {
        console.error('Error in add-player:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
