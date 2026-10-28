import { db } from '../src/db/index.js';
import { rewards } from '../src/db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { GameError, getPlayerState, judgeDays, listHistory, purchase, resetGame, setDifficultyMode } from '../src/game/engine.js';

// Single function for all game actions (Vercel Hobby allows max 12 functions).
export default async function handler(req: any, res: any) {
    const { action, id } = req.query;

    try {
        if (action === 'state' && req.method === 'GET') {
            return res.status(200).json({ player: await getPlayerState() });
        }

        if (action === 'history' && req.method === 'GET') {
            const limit = Math.min(parseInt(req.query.limit) || 50, 200);
            return res.status(200).json(await listHistory(limit, req.query.type || undefined));
        }

        if (action === 'judge' && req.method === 'POST') {
            return res.status(200).json(await judgeDays(req.body.today));
        }

        if (action === 'purchase' && req.method === 'POST') {
            const { rewardId, item, today } = req.body;
            return res.status(200).json({ game: await purchase({ rewardId, item }, today) });
        }

        if (action === 'reset' && req.method === 'POST') {
            return res.status(200).json({ game: await resetGame(req.body.today) });
        }

        if (action === 'settings' && req.method === 'POST') {
            return res.status(200).json({ game: await setDifficultyMode(req.body.mode) });
        }

        if (action === 'rewards') {
            if (req.method === 'GET') {
                const all = await db.select().from(rewards)
                    .where(eq(rewards.archived, false))
                    .orderBy(asc(rewards.cost));
                return res.status(200).json(all);
            }
            if (req.method === 'POST') {
                const { name, emoji, cost, note } = req.body;
                const created = await db.insert(rewards).values({
                    name, emoji: emoji || '🎁', cost: Math.max(1, parseInt(cost) || 1), note: note || null,
                }).returning();
                return res.status(201).json(created[0]);
            }
            if (req.method === 'PATCH' && id) {
                const { name, emoji, cost, note } = req.body;
                const updated = await db.update(rewards)
                    .set({ name, emoji, cost: cost !== undefined ? Math.max(1, parseInt(cost) || 1) : undefined, note })
                    .where(eq(rewards.id, id))
                    .returning();
                return res.status(200).json(updated[0]);
            }
            if (req.method === 'DELETE' && id) {
                // Archive instead of delete so purchase history keeps its reference
                await db.update(rewards).set({ archived: true }).where(eq(rewards.id, id));
                return res.status(204).end();
            }
        }

        return res.status(405).json({ message: 'Method not allowed' });
    } catch (error) {
        if (error instanceof GameError) {
            return res.status(400).json({ message: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
