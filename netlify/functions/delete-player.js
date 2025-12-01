const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const sql = neon();
        const { playerId } = JSON.parse(event.body);
        
        if (!playerId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Player ID is required' })
            };
        }

        // Get current player data for audit
        const currentPlayer = await sql(
            'SELECT id, name, team_name, account_number FROM players WHERE id = $1',
            [playerId]
        );

        if (!currentPlayer || currentPlayer.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Player not found' })
            };
        }

        // Log this action in audit table before deletion
        await sql(
            `INSERT INTO player_audit (player_id, action, old_values, new_values, changed_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
            [playerId, 'DELETE', JSON.stringify(currentPlayer[0]), null]
        );

        // Delete the player
        await sql(
            'DELETE FROM players WHERE id = $1',
            [playerId]
        );
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Player deleted successfully' })
        };
    } catch (error) {
        console.error('Error in delete-player:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
