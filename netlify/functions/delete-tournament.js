const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    if (event.httpMethod !== 'DELETE') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const sql = neon();
        const { tournamentId } = JSON.parse(event.body);
        
        if (!tournamentId) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Tournament ID is required' }) };
        }
        
        // Update tournament status to deleted
        await sql(
            'UPDATE tournaments SET status = $1 WHERE id = $2',
            ['deleted', tournamentId]
        );
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Tournament deleted successfully' })
        };
    } catch (error) {
        console.error('Error deleting tournament:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
