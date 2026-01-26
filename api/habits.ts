import { db } from '../src/db/index.ts';
import { habits } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const allHabits = await db.select().from(habits);
            return res.status(200).json(allHabits);
        }

        if (req.method === 'POST') {
            const { name, category, frequency, goal } = req.body;
            const newHabit = await db.insert(habits).values({
                name,
                category: category || 'General',
                frequency,
                goal,
            }).returning();
            return res.status(201).json(newHabit[0]);
        }

        // Handle other methods or return 405
        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
