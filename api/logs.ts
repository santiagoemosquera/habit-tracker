import { db } from '../src/db/index.js';
import { habitLogs } from '../src/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { onHabitLogChanged } from '../src/game/engine.js';

export default async function handler(req: any, res: any) {
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

            const prevValue = existing.length > 0 ? existing[0].value : 0;

            if (existing.length > 0) {
                if (value === 0) {
                    await db.delete(habitLogs).where(eq(habitLogs.id, existing[0].id));
                    const game = await onHabitLogChanged(habitId, date, prevValue, 0);
                    return res.status(200).json({ deleted: true, game });
                } else {
                    const updated = await db.update(habitLogs)
                        .set({ value })
                        .where(eq(habitLogs.id, existing[0].id))
                        .returning();
                    const game = await onHabitLogChanged(habitId, date, prevValue, value);
                    return res.status(200).json({ ...updated[0], game });
                }
            } else {
                if (value > 0) {
                    const newLog = await db.insert(habitLogs).values({
                        habitId,
                        date,
                        value
                    }).returning();
                    const game = await onHabitLogChanged(habitId, date, 0, value);
                    return res.status(201).json({ ...newLog[0], game });
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
