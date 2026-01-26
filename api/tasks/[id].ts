import { db } from '../../src/db/index.js';
import { tasks } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: any, res: any) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'Missing task ID' });
    }

    try {
        if (req.method === 'PATCH') {
            const updates = req.body;
            const updatedTask = await db.update(tasks)
                .set(updates)
                .where(eq(tasks.id, id))
                .returning();

            return res.status(200).json(updatedTask[0]);
        }

        if (req.method === 'DELETE') {
            await db.delete(tasks).where(eq(tasks.id, id));
            return res.status(204).end();
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
