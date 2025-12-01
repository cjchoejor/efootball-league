const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const sql = neon();
        const { playerId, name, teamName, accountNumber, photoUrl } = JSON.parse(event.body);
        
        if (!playerId || !name || !teamName || !accountNumber) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        // Get current player data for audit
        const currentPlayer = await sql(
            'SELECT name, team_name, account_number, photo_url FROM players WHERE id = $1',
            [playerId]
        );

        if (!currentPlayer || currentPlayer.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Player not found' })
            };
        }

        const oldValues = currentPlayer[0];
        
        // Update player - only update photo if new one provided
        if (photoUrl) {
            await sql(
                `UPDATE players 
                 SET name = $1, team_name = $2, account_number = $3, photo_url = $4, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5`,
                [name, teamName, accountNumber, photoUrl, playerId]
            );
        } else {
            await sql(
                `UPDATE players 
                 SET name = $1, team_name = $2, account_number = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [name, teamName, accountNumber, playerId]
            );
        }

        // Log this action in audit table
        await sql(
            `INSERT INTO player_audit (player_id, action, old_values, new_values, changed_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [playerId, 'UPDATE', JSON.stringify(oldValues), JSON.stringify({ name, teamName, accountNumber })]
        );
        
        return {
            statusCode: 200,
            body: JSON.stringify({ playerId, name, teamName, accountNumber })
        };
    } catch (error) {
        console.error('Error in update-player:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
