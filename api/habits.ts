import { db } from '../src/db/index.js';
import { habits } from '../src/db/schema.js';
import { eq, asc } from 'drizzle-orm';

export default async function handler(req: any, res: any) {
    try {
        if (req.method === 'GET') {
            const allHabits = await db.select().from(habits).orderBy(asc(habits.order), asc(habits.createdAt));
            return res.status(200).json(allHabits);
        }

        if (req.method === 'POST') {
            const { name, category, frequency, goal, metricType, targetValue, unit, kind, difficulty, attribute, customXp, customGold, customHp, activeDays } = req.body;
            const newHabit = await db.insert(habits).values({
                name,
                category: category || 'General',
                frequency,
                goal,
                metricType: metricType || 'boolean',
                targetValue: targetValue || 1,
                unit: unit || null,
                kind: kind === 'bad' ? 'bad' : 'good',
                difficulty: difficulty || (kind === 'bad' ? 'medium' : 'easy'),
                attribute: attribute || null,
                customXp: customXp ?? null,
                customGold: customGold ?? null,
                customHp: customHp ?? null,
                activeDays: activeDays || null,
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
