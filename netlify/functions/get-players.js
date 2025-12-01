const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    try {
        const sql = neon();
        
        const players = await sql(`
            SELECT id, name, team_name, account_number, photo_url, created_at
            FROM players
            ORDER BY created_at DESC
        `);
        
        return {
            statusCode: 200,
            body: JSON.stringify(players)
        };
    } catch (error) {
        console.error('Error in get-players:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
