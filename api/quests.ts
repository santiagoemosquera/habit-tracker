import { db } from '../src/db/index.js';
import { quests, questSteps } from '../src/db/schema.js';
import { eq, asc, desc } from 'drizzle-orm';
import { GameError, completeQuest, deleteQuest, deleteQuestStep, reopenQuest, toggleQuestStep } from '../src/game/engine.js';

const QUEST_FIELDS = ['title', 'notes', 'size', 'attribute', 'deadline', 'customXp', 'customGold', 'penalizeOverdue'] as const;

const pickQuestFields = (body: any) => {
    const out: Record<string, any> = {};
    for (const key of QUEST_FIELDS) {
        if (body[key] !== undefined) out[key] = body[key] === '' ? null : body[key];
    }
    return out;
};

const withSteps = async (questId: string) => {
    const [quest] = await db.select().from(quests).where(eq(quests.id, questId));
    if (!quest) return null;
    const steps = await db.select().from(questSteps).where(eq(questSteps.questId, questId)).orderBy(asc(questSteps.order), asc(questSteps.createdAt));
    return { ...quest, steps };
};

// Single function for quests + their steps (Vercel Hobby allows max 12 functions).
export default async function handler(req: any, res: any) {
    const { action, id } = req.query;

    try {
        if (req.method === 'GET') {
            const all = await db.select().from(quests).orderBy(desc(quests.createdAt));
            const steps = await db.select().from(questSteps).orderBy(asc(questSteps.order), asc(questSteps.createdAt));
            return res.status(200).json(all.map(q => ({ ...q, steps: steps.filter(s => s.questId === q.id) })));
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Method not allowed' });
        }

        switch (action) {
            case 'create': {
                const fields = pickQuestFields(req.body);
                if (!fields.title) return res.status(400).json({ message: 'Missing title' });
                const [created] = await db.insert(quests).values(fields as any).returning();
                return res.status(201).json({ ...created, steps: [] });
            }
            case 'update': {
                await db.update(quests).set(pickQuestFields(req.body)).where(eq(quests.id, id));
                return res.status(200).json(await withSteps(id));
            }
            case 'delete': {
                const game = await deleteQuest(id);
                return res.status(200).json({ game });
            }
            case 'complete': {
                const game = await completeQuest(id, req.body.today);
                return res.status(200).json({ quest: await withSteps(id), game });
            }
            case 'reopen': {
                const game = await reopenQuest(id);
                return res.status(200).json({ quest: await withSteps(id), game });
            }
            case 'addStep': {
                const existing = await db.select().from(questSteps).where(eq(questSteps.questId, id));
                const [step] = await db.insert(questSteps).values({
                    questId: id, title: req.body.title, order: existing.length,
                }).returning();
                return res.status(201).json(step);
            }
            case 'toggleStep': {
                return res.status(200).json(await toggleQuestStep(id, req.body.today));
            }
            case 'deleteStep': {
                const game = await deleteQuestStep(id);
                return res.status(200).json({ game });
            }
        }

        return res.status(400).json({ message: 'Unknown action' });
    } catch (error) {
        if (error instanceof GameError) {
            return res.status(400).json({ message: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
