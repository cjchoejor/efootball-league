const { neon } = require('@netlify/neon');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const sql = neon();
        const { tournamentId } = JSON.parse(event.body);

        if (!tournamentId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Tournament ID is required' })
            };
        }

        console.log('Ending league for tournament:', tournamentId);

        // Update all matches for this tournament to ENDED status
        await sql(
            `UPDATE matches SET league_status = 'ENDED' 
             WHERE tournament_id = $1`,
            [tournamentId]
        );

        // Update tournament status to finished
        await sql(
            `UPDATE tournaments SET status = 'finished', completed_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [tournamentId]
        );

        console.log('League ended successfully for tournament:', tournamentId);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'League ended successfully' })
        };
    } catch (error) {
        console.error('Error in end-league:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
