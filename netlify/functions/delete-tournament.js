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
        
        console.log('Deleting tournament:', tournamentId);
        
        // Delete in order of dependencies (foreign keys)
        // 1. Delete matches
        await sql('DELETE FROM matches WHERE tournament_id = $1', [tournamentId]);
        console.log('Deleted matches for tournament:', tournamentId);
        
        // 2. Delete tournament stats
        await sql('DELETE FROM tournament_stats WHERE tournament_id = $1', [tournamentId]);
        console.log('Deleted stats for tournament:', tournamentId);
        
        // 3. Delete tournament players
        await sql('DELETE FROM tournament_players WHERE tournament_id = $1', [tournamentId]);
        console.log('Deleted players for tournament:', tournamentId);
        
        // 4. Delete tournament
        await sql('DELETE FROM tournaments WHERE id = $1', [tournamentId]);
        console.log('Deleted tournament:', tournamentId);
        
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
