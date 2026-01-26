import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    try {
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            return res.status(500).json({ error: 'DATABASE_URL is missing' });
        }

        const sql = neon(dbUrl);
        const result = await sql`SELECT 1 as val`;

        return res.status(200).json({
            status: 'connected',
            result: result
        });
    } catch (error: any) {
        return res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
}
