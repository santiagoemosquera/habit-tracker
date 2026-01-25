import { db } from '../src/db';
import { habits } from '../src/db/schema';
import { sql } from 'drizzle-orm';

export default async function handler(req, res) {
    try {
        const dbUrlExists = !!process.env.DATABASE_URL;
        // Mask the URL for safety if we were to return it, but just boolean is safer.
        // We can show the first few chars to check if it matches prod vs dev.
        const dbUrlStart = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'NONE';

        let dbStatus = 'UNKNOWN';
        let dbError = null;
        let count = -1;

        try {
            const result = await db.select({ count: sql<number>`count(*)` }).from(habits);
            count = Number(result[0].count);
            dbStatus = 'CONNECTED';
        } catch (e: any) {
            dbStatus = 'FAILED';
            dbError = e.message;
            console.error("DB Connection Error:", e);
        }

        return res.status(200).json({
            environment: process.env.NODE_ENV,
            db_url_exists: dbUrlExists,
            db_url_prefix: dbUrlStart,
            db_status: dbStatus,
            habit_count: count,
            error: dbError
        });

    } catch (error: any) {
        return res.status(500).json({
            message: 'Internal Server Error in Debug Handler',
            error: error.message
        });
    }
}
