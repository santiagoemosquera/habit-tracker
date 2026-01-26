import { db } from '../src/db/index.ts';
import { tasks } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const allTasks = await db.select().from(tasks);
            return res.status(200).json(allTasks);
        }

        if (req.method === 'POST') {
            const { title, estimatedPomodoros, priority, deadline } = req.body;
            const newTask = await db.insert(tasks).values({
                title,
                estimatedPomodoros,
                priority: priority || 'none',
                deadline,
                completedPomodoros: 0,
                status: 'pending'
            }).returning();
            return res.status(201).json(newTask[0]);
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
