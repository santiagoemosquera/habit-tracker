import { db } from '../../src/db';
import { habits } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'Missing habit ID' });
    }

    try {
        if (req.method === 'PATCH') {
            const updates = req.body;
            const updatedHabit = await db.update(habits)
                .set(updates)
                .where(eq(habits.id, id))
                .returning();

            return res.status(200).json(updatedHabit[0]);
        }

        if (req.method === 'DELETE') {
            await db.delete(habits).where(eq(habits.id, id));
            return res.status(204).end();
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
