import { db } from '../src/db/index.ts';
import { habitLogs } from '../src/db/schema.ts';
import { eq, and } from 'drizzle-orm';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            // Potentially filter by date range query params here
            const allLogs = await db.select().from(habitLogs);
            return res.status(200).json(allLogs);
        }

        if (req.method === 'POST') {
            const { habitId, date, value } = req.body;

            // Check if exists
            const existing = await db.select().from(habitLogs)
                .where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.date, date)));

            if (existing.length > 0) {
                if (value === 0) {
                    await db.delete(habitLogs).where(eq(habitLogs.id, existing[0].id));
                    return res.status(200).json({ deleted: true });
                } else {
                    const updated = await db.update(habitLogs)
                        .set({ value })
                        .where(eq(habitLogs.id, existing[0].id))
                        .returning();
                    return res.status(200).json(updated[0]);
                }
            } else {
                if (value > 0) {
                    const newLog = await db.insert(habitLogs).values({
                        habitId,
                        date,
                        value
                    }).returning();
                    return res.status(201).json(newLog[0]);
                }
            }
            return res.status(200).json({ message: 'No action needed' });
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
