// Server-side game engine. Every XP / gold change is a row in game_events;
// HP, combo and shields live in the single `player` row.
import { db } from '../db/index.js';
import { gameEvents, player, habits, habitLogs, quests, questSteps, rewards } from '../db/schema.js';
import { and, eq, sql, desc, gte, lte, inArray, isNotNull } from 'drizzle-orm';
import { addDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import {
    ATTRIBUTE_KEYS, MODES, PERFECT_DAY, CLEAN_DAY_XP, MAX_JUDGED_DAYS, COMBO_THRESHOLD, SHOP_ITEMS,
    levelFromXp, titleForLevel, maxHp, comboMultiplier, xpToNext, attributeForHabit, isBadHabit, isLogCompleted, isLogSatisfied, logTier, isActiveOn,
    computeHabitReward, computeHabitGoalBonus, computeBadHabitPenalty, computeMissedDailyDamage,
    computeQuestReward, computeQuestStepXp, computeQuestOverduePenalty,
} from './rules.js';
import type { ShopItem } from './rules.js';
import type { Attribute, DifficultyMode, GameDelta, GamePayload, JudgmentDay, PlayerState } from '../types/game';

type HabitRow = typeof habits.$inferSelect;
type PlayerRow = typeof player.$inferSelect;
type NewEvent = typeof gameEvents.$inferInsert;

export class GameError extends Error { }

const parseDay = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day);
};
const fmtDay = (d: Date) => format(d, 'yyyy-MM-dd');
const createdDay = (h: { createdAt: Date | string }) => fmtDay(new Date(h.createdAt));

async function getPlayerRow(): Promise<PlayerRow> {
    const rows = await db.select().from(player).limit(1);
    if (rows.length > 0) return rows[0];
    const created = await db.insert(player).values({}).returning();
    return created[0];
}

async function getTotals() {
    const [t] = await db.select({
        xp: sql<number>`coalesce(sum(${gameEvents.xp}), 0)`.mapWith(Number),
        gold: sql<number>`coalesce(sum(${gameEvents.gold}), 0)`.mapWith(Number),
    }).from(gameEvents);
    return { gold: t.gold, ...levelFromXp(t.xp) };
}

function modeOf(p: PlayerRow): DifficultyMode {
    return (p.difficultyMode in MODES ? p.difficultyMode : 'normal') as DifficultyMode;
}

export async function getPlayerState(row?: PlayerRow): Promise<PlayerState> {
    const [p, totals, byAttr] = await Promise.all([
        row ?? getPlayerRow(),
        getTotals(),
        db.select({
            attribute: gameEvents.attribute,
            xp: sql<number>`coalesce(sum(${gameEvents.xp}), 0)`.mapWith(Number),
        }).from(gameEvents).groupBy(gameEvents.attribute),
    ]);

    const attributes = {} as PlayerState['attributes'];
    for (const key of ATTRIBUTE_KEYS) {
        const found = byAttr.find(a => a.attribute === key);
        attributes[key] = levelFromXp(Math.max(0, found?.xp ?? 0));
    }

    const mhp = maxHp(totals.level);
    return {
        xp: totals.xp,
        level: totals.level,
        xpIntoLevel: totals.xpIntoLevel,
        xpForNext: totals.xpForNext,
        gold: totals.gold,
        hp: Math.min(p.hp, mhp),
        maxHp: mhp,
        combo: p.combo,
        comboMultiplier: comboMultiplier(p.combo),
        shields: p.shields,
        mode: modeOf(p),
        title: titleForLevel(totals.level),
        attributes,
        lastJudgedDate: p.lastJudgedDate,
    };
}

export async function listHistory(limit = 50, type?: string) {
    const query = db.select().from(gameEvents);
    const rows = type
        ? await query.where(eq(gameEvents.type, type)).orderBy(desc(gameEvents.createdAt)).limit(limit)
        : await query.orderBy(desc(gameEvents.createdAt)).limit(limit);
    return rows;
}

/** One game action: collects deltas for the UI and persists player changes at the end. */
class Game {
    deltas: GameDelta[] = [];
    private dirty = false;

    constructor(public p: PlayerRow) { }

    static async load() {
        return new Game(await getPlayerRow());
    }

    get mode() {
        return modeOf(this.p);
    }

    set(patch: Partial<PlayerRow>) {
        this.p = { ...this.p, ...patch };
        this.dirty = true;
    }

    async insert(ev: NewEvent) {
        const rows = await db.insert(gameEvents).values(ev).onConflictDoNothing().returning();
        return rows[0];
    }

    /** Deletes matching events and pushes a "revert" toast for each. */
    async revoke(where: ReturnType<typeof and>, label?: string) {
        const removed = await db.delete(gameEvents).where(where).returning();
        for (const ev of removed) {
            this.deltas.push({
                label: label ?? `Deshecho: ${ev.label ?? ev.type}`,
                xp: -ev.xp, gold: -ev.gold, hp: 0,
                attribute: ev.attribute as Attribute | null, tone: 'revert',
            });
        }
        return removed;
    }

    async applyHp(delta: number, date: string) {
        if (delta === 0) return;
        const totals = await getTotals();
        const mhp = maxHp(totals.level);
        const next = Math.max(0, Math.min(mhp, Math.min(this.p.hp, mhp) + delta));
        this.set({ hp: next });
        if (next <= 0) await this.die(date);
    }

    private async die(date: string) {
        const totals = await getTotals();
        const m = MODES[this.mode];
        const goldLoss = totals.gold > 0 ? Math.round(totals.gold * m.deathGoldPct) : 0;
        const xpLoss = m.deathLosesLevel && totals.level > 1 ? totals.xpIntoLevel + xpToNext(totals.level - 1) : 0;
        const levelAfter = levelFromXp(totals.xp - xpLoss).level;

        await this.insert({
            type: 'death', date, xp: -xpLoss, gold: -goldLoss, hp: 0, label: 'Derrota',
            meta: { mode: this.mode, goldLoss, xpLoss },
        });
        this.set({
            hp: Math.round(maxHp(levelAfter) * 0.5),
            combo: m.deathResetsCombo ? 0 : this.p.combo,
        });
        this.deltas.push({
            label: '💀 ¡Derrota! Te quedaste sin vida', xp: -xpLoss, gold: -goldLoss, hp: 0, tone: 'penalty',
        });
    }

    async finish(): Promise<GamePayload> {
        if (this.dirty) {
            const { id, createdAt, ...rest } = this.p;
            void createdAt;
            await db.update(player).set(rest).where(eq(player.id, id));
        }
        return { deltas: this.deltas, player: await getPlayerState(this.p) };
    }

    // --- Habits ---

    /** Keeps the habit's reward event in line with the logged value and emits only the difference. */
    async syncHabitReward(habit: HabitRow, date: string, prev: number, next: number) {
        const where = and(eq(gameEvents.type, 'habit'), eq(gameEvents.sourceId, habit.id), eq(gameEvents.date, date));
        const [existing] = await db.select().from(gameEvents).where(where);
        // Keep the combo the reward was first earned with, so editing the value doesn't re-price it
        const combo = (existing?.meta as { combo?: number } | null)?.combo ?? this.p.combo;
        const r = computeHabitReward(habit, date, combo, this.mode, next);
        const attribute = attributeForHabit(habit);
        const oldXp = existing?.xp ?? 0;
        const oldGold = existing?.gold ?? 0;

        if (logTier(habit, next) === 'minimum' && logTier(habit, prev) !== 'minimum') {
            this.deltas.push({ label: `🟡 Mínimo viable: ${habit.name} (racha salvada)`, xp: 0, gold: 0, hp: 0, tone: 'info' });
        }
        if (r.xp === oldXp && r.gold === oldGold) return;

        if (existing) await db.delete(gameEvents).where(where);
        if (r.xp > 0 || r.gold > 0) {
            await this.insert({
                type: 'habit', sourceId: habit.id, date, xp: r.xp, gold: r.gold, attribute, label: habit.name,
                meta: { crit: r.crit, drop: r.drop, combo, bonusXp: r.bonusXp, bonusGold: r.bonusGold, value: next },
            });
        }

        const dXp = r.xp - oldXp;
        const dGold = r.gold - oldGold;
        const firstAward = !existing;
        const label = firstAward
            ? (r.bonusXp > 0 ? `${habit.name} (+extra)` : habit.name)
            : r.xp === 0 ? `Deshecho: ${habit.name}`
                : dXp > 0 ? `🔥 Extra: ${habit.name}` : `Menos extra: ${habit.name}`;
        this.deltas.push({
            label, xp: dXp, gold: dGold, hp: 0, attribute,
            crit: firstAward && r.crit, drop: firstAward ? r.drop : 0,
            tone: dXp > 0 || dGold > 0 ? 'reward' : 'revert',
        });
    }

    async syncHabitGoal(habit: HabitRow, date: string) {
        const day = parseDay(date);
        const weekly = habit.frequency === 'weekly';
        const start = weekly ? startOfWeek(day, { weekStartsOn: 1 }) : startOfMonth(day);
        const end = weekly ? endOfWeek(day, { weekStartsOn: 1 }) : endOfMonth(day);
        const periodStart = fmtDay(start);

        const where = and(eq(gameEvents.type, 'habit_goal'), eq(gameEvents.sourceId, habit.id), eq(gameEvents.date, periodStart));
        const [logs, existing] = await Promise.all([
            db.select().from(habitLogs).where(and(
                eq(habitLogs.habitId, habit.id), gte(habitLogs.date, periodStart), lte(habitLogs.date, fmtDay(end)),
            )),
            db.select().from(gameEvents).where(where),
        ]);
        const met = habit.metricType === 'numeric'
            ? logs.reduce((acc, l) => acc + l.value, 0) >= (habit.targetValue || 1) * (habit.goal || 1)
            : logs.filter(l => isLogCompleted(habit, l.value)).length >= (habit.goal || 1);

        if (met && existing.length === 0) {
            const bonus = computeHabitGoalBonus(habit, this.mode);
            const attribute = attributeForHabit(habit);
            const label = `Meta ${weekly ? 'semanal' : 'mensual'}: ${habit.name}`;
            const ev = await this.insert({ type: 'habit_goal', sourceId: habit.id, date: periodStart, ...bonus, attribute, label });
            if (ev) this.deltas.push({ label: `🎯 ${label}`, ...bonus, hp: 0, attribute, tone: 'reward' });
        } else if (!met && existing.length > 0) {
            await this.revoke(where);
        }
    }

    async syncPerfectDay(date: string) {
        const where = and(eq(gameEvents.type, 'perfect_day'), eq(gameEvents.date, date));
        const [allDailies, logs, existing] = await Promise.all([
            db.select().from(habits).where(and(
                eq(habits.archived, false), eq(habits.kind, 'good'), eq(habits.frequency, 'daily'),
            )),
            db.select().from(habitLogs).where(eq(habitLogs.date, date)),
            db.select().from(gameEvents).where(where),
        ]);
        const dailies = allDailies.filter(h => createdDay(h) <= date && isActiveOn(h, date));
        const allDone = dailies.length > 0 && dailies.every(h =>
            logs.some(l => l.habitId === h.id && isLogCompleted(h, l.value)));

        if (allDone && existing.length === 0) {
            const reward = MODES[this.mode].reward;
            const xp = Math.round(PERFECT_DAY.xp * reward);
            const gold = Math.round(PERFECT_DAY.gold * reward);
            const ev = await this.insert({ type: 'perfect_day', date, xp, gold, label: 'Día Perfecto' });
            if (ev) this.deltas.push({ label: '⭐ ¡Día Perfecto!', xp, gold, hp: 0, tone: 'reward' });
        } else if (!allDone && existing.length > 0) {
            await this.revoke(where, 'Día Perfecto perdido');
        }
    }

    async recordSlips(habit: HabitRow, date: string, prev: number, next: number) {
        const diff = next - prev;
        if (diff === 0) return;
        const pen = computeBadHabitPenalty(habit, this.mode);

        // A relapse logged on a day that was already judged cancels the "clean day" XP that day earned
        const alreadyJudged = !!this.p.lastJudgedDate && date <= this.p.lastJudgedDate && createdDay(habit) <= date;
        const cleanXp = alreadyJudged ? Math.round(CLEAN_DAY_XP * MODES[this.mode].reward) : 0;
        const xpFor = (count: number) => (count > 0 ? -cleanXp : 0);

        await db.delete(gameEvents).where(and(
            eq(gameEvents.type, 'bad_habit'), eq(gameEvents.sourceId, habit.id), eq(gameEvents.date, date),
        ));
        if (next > 0) {
            await this.insert({
                type: 'bad_habit', sourceId: habit.id, date, gold: -pen.gold * next, hp: -pen.hp * next,
                xp: xpFor(next), attribute: cleanXp > 0 ? 'spirit' : null,
                label: habit.name, meta: { count: next },
            });
        }
        this.deltas.push({
            label: diff > 0 ? `Recaída: ${habit.name}` : `Deshecho: ${habit.name}`,
            xp: xpFor(next) - xpFor(prev), gold: -pen.gold * diff, hp: -pen.hp * diff,
            tone: diff > 0 ? 'penalty' : 'revert',
        });
        await this.applyHp(-pen.hp * diff, date);
    }
}

// --- Public actions ---

export async function onHabitLogChanged(habitId: string, date: string, prev: number, next: number) {
    const [[habit], g] = await Promise.all([
        db.select().from(habits).where(eq(habits.id, habitId)),
        Game.load(),
    ]);
    if (!habit) return null;

    if (isBadHabit(habit)) {
        await g.recordSlips(habit, date, prev, next);
    } else {
        await Promise.all([
            g.syncHabitReward(habit, date, prev, next),
            habit.frequency === 'daily' ? g.syncPerfectDay(date) : g.syncHabitGoal(habit, date),
        ]);
    }
    return g.finish();
}

/** Starts the game over: wipes XP/gold history and the player, keeping habits, logs, quests and the shop. */
export async function resetGame(today: string) {
    const previous = await getPlayerRow();
    await db.delete(gameEvents);
    await db.delete(player);
    const [row] = await db.insert(player).values({
        difficultyMode: previous.difficultyMode,
        // Start judging from today so past days aren't punished again
        lastJudgedDate: fmtDay(subDays(parseDay(today), 1)),
    }).returning();
    return { deltas: [], player: await getPlayerState(row) } as GamePayload;
}

export async function setDifficultyMode(mode: string) {
    if (!(mode in MODES)) throw new GameError('Modo de dificultad inválido');
    const g = await Game.load();
    g.set({ difficultyMode: mode });
    return g.finish();
}

export async function purchase(input: { rewardId?: string; item?: ShopItem }, today: string) {
    const g = await Game.load();
    const totals = await getTotals();

    if (input.item === 'potion') {
        const item = SHOP_ITEMS.potion;
        if (totals.gold < item.cost) throw new GameError('No te alcanza el oro');
        if (g.p.hp >= maxHp(totals.level)) throw new GameError('Ya tenés la vida al máximo');
        await g.insert({ type: 'potion', date: today, gold: -item.cost, hp: item.hp, label: item.name });
        await g.applyHp(item.hp, today);
        g.deltas.push({ label: `${item.emoji} ${item.name}`, xp: 0, gold: -item.cost, hp: item.hp, tone: 'info' });
    } else if (input.item === 'shield') {
        const item = SHOP_ITEMS.shield;
        if (totals.gold < item.cost) throw new GameError('No te alcanza el oro');
        if (g.p.shields >= item.max) throw new GameError(`Ya tenés ${item.max} escudos`);
        await g.insert({ type: 'shield', date: today, gold: -item.cost, label: item.name });
        g.set({ shields: g.p.shields + 1 });
        g.deltas.push({ label: `${item.emoji} ${item.name}`, xp: 0, gold: -item.cost, hp: 0, tone: 'info' });
    } else if (input.rewardId) {
        const [reward] = await db.select().from(rewards).where(eq(rewards.id, input.rewardId));
        if (!reward || reward.archived) throw new GameError('Premio no encontrado');
        if (totals.gold < reward.cost) throw new GameError('No te alcanza el oro');
        await g.insert({
            type: 'purchase', sourceId: reward.id, date: today, gold: -reward.cost,
            label: `${reward.emoji} ${reward.name}`,
        });
        g.deltas.push({ label: `Canjeaste ${reward.emoji} ${reward.name}`, xp: 0, gold: -reward.cost, hp: 0, tone: 'info' });
    } else {
        throw new GameError('Nada para comprar');
    }
    return g.finish();
}

// --- Quests ---

export async function completeQuest(id: string, today: string) {
    const [quest] = await db.select().from(quests).where(eq(quests.id, id));
    if (!quest) throw new GameError('Misión no encontrada');
    const g = await Game.load();
    if (quest.status !== 'done') {
        const r = computeQuestReward(quest, today, g.mode);
        const attribute = (quest.attribute as Attribute | null) ?? 'discipline';
        await db.update(quests).set({ status: 'done', completedAt: today }).where(eq(quests.id, id));
        const ev = await g.insert({
            type: 'quest', sourceId: id, date: today, xp: r.xp, gold: r.gold, attribute,
            label: quest.title, meta: { onTime: r.onTime },
        });
        if (ev) {
            g.deltas.push({
                label: `🗡️ Misión cumplida: ${quest.title}${r.onTime ? ' (a tiempo +25%)' : ''}`,
                xp: r.xp, gold: r.gold, hp: 0, attribute, tone: 'reward',
            });
        }
    }
    return g.finish();
}

export async function reopenQuest(id: string) {
    const g = await Game.load();
    await db.update(quests).set({ status: 'open', completedAt: null }).where(eq(quests.id, id));
    await g.revoke(and(eq(gameEvents.type, 'quest'), eq(gameEvents.sourceId, id)));
    return g.finish();
}

export async function toggleQuestStep(stepId: string, today: string) {
    const [step] = await db.select().from(questSteps).where(eq(questSteps.id, stepId));
    if (!step) throw new GameError('Paso no encontrado');
    const [quest] = await db.select().from(quests).where(eq(quests.id, step.questId));
    const g = await Game.load();
    const done = !step.done;
    const [updated] = await db.update(questSteps).set({ done }).where(eq(questSteps.id, stepId)).returning();

    if (done) {
        const xp = computeQuestStepXp(g.mode);
        const attribute = (quest?.attribute as Attribute | null) ?? 'discipline';
        const ev = await g.insert({ type: 'quest_step', sourceId: stepId, date: today, xp, attribute, label: step.title });
        if (ev) g.deltas.push({ label: step.title, xp, gold: 0, hp: 0, attribute, tone: 'reward' });
    } else {
        await g.revoke(and(eq(gameEvents.type, 'quest_step'), eq(gameEvents.sourceId, stepId)));
    }
    return { step: updated, game: await g.finish() };
}

export async function deleteQuestStep(stepId: string) {
    const g = await Game.load();
    await g.revoke(and(eq(gameEvents.type, 'quest_step'), eq(gameEvents.sourceId, stepId)));
    await db.delete(questSteps).where(eq(questSteps.id, stepId));
    return g.finish();
}

/** Deleting an open quest reverts the XP of its steps; a completed quest keeps its rewards. */
export async function deleteQuest(id: string) {
    const [quest] = await db.select().from(quests).where(eq(quests.id, id));
    const g = await Game.load();
    if (quest && quest.status !== 'done') {
        const steps = await db.select().from(questSteps).where(eq(questSteps.questId, id));
        if (steps.length > 0) {
            await g.revoke(and(eq(gameEvents.type, 'quest_step'), inArray(gameEvents.sourceId, steps.map(s => s.id))));
        }
    }
    await db.delete(quests).where(eq(quests.id, id));
    return g.finish();
}

// --- Daily judgment ---

export async function judgeDays(today: string): Promise<{ report: JudgmentDay[]; game: GamePayload }> {
    const g = await Game.load();
    const yesterday = fmtDay(subDays(parseDay(today), 1));
    const report: JudgmentDay[] = [];

    if (!g.p.lastJudgedDate) {
        // First run: start the game today, nothing to judge.
        g.set({ lastJudgedDate: yesterday });
        return { report, game: await g.finish() };
    }

    let start = addDays(parseDay(g.p.lastJudgedDate), 1);
    const earliest = subDays(parseDay(today), MAX_JUDGED_DAYS);
    if (start < earliest) start = earliest;
    const startStr = fmtDay(start);
    if (startStr > yesterday) return { report, game: await g.finish() };

    const allHabits = await db.select().from(habits).where(eq(habits.archived, false));
    const logs = await db.select().from(habitLogs).where(and(gte(habitLogs.date, startStr), lte(habitLogs.date, yesterday)));
    const overdueQuests = await db.select().from(quests).where(and(
        eq(quests.status, 'open'), eq(quests.penalizeOverdue, true), isNotNull(quests.deadline),
        gte(quests.deadline, startStr), lte(quests.deadline, yesterday),
    ));
    const mode = g.mode;
    const m = MODES[mode];

    for (let d = start; fmtDay(d) <= yesterday; d = addDays(d, 1)) {
        const date = fmtDay(d);
        const existing = allHabits.filter(h => createdDay(h) <= date);
        const dailies = existing.filter(h => !isBadHabit(h) && h.frequency === 'daily' && isActiveOn(h, date));
        const bads = existing.filter(h => isBadHabit(h));
        const dayLogs = logs.filter(l => l.date === date);
        // Minimum viable protects HP and combo; the Perfect Day needs every target
        const valueFor = (h: HabitRow) => dayLogs.find(l => l.habitId === h.id)?.value ?? 0;
        const satisfied = (h: HabitRow) => isLogSatisfied(h, valueFor(h));
        const full = (h: HabitRow) => isLogCompleted(h, valueFor(h));

        const completed = dailies.filter(satisfied).length;
        const minimums = dailies.filter(h => satisfied(h) && !full(h)).length;
        const missed = dailies.filter(h => !satisfied(h));
        const damage = m.missedDaily > 0 ? missed.reduce((acc, h) => acc + computeMissedDailyDamage(h, mode), 0) : 0;
        const cleanDays = bads.filter(h => !dayLogs.some(l => l.habitId === h.id && l.value > 0)).length;
        const cleanXp = cleanDays * Math.round(CLEAN_DAY_XP * m.reward);
        const perfect = dailies.length > 0 && dailies.every(full);
        const regen = perfect ? PERFECT_DAY.regen : 0;

        let comboBroken = false;
        let shieldUsed = false;
        let combo = g.p.combo;
        let shields = g.p.shields;
        if (dailies.length > 0) {
            if (completed / dailies.length >= COMBO_THRESHOLD) combo++;
            else if (shields > 0) { shields--; shieldUsed = true; }
            else { comboBroken = combo > 0; combo = 0; }
        }

        const day: JudgmentDay = {
            date, completed, total: dailies.length, damage, regen, cleanDays, cleanXp,
            comboAfter: combo, comboBroken, shieldUsed, perfect, death: false, overdue: 0, minimums,
        };

        // The unique (type, date) index makes judging idempotent across concurrent calls.
        const ev = await g.insert({
            type: 'judgment', date, xp: cleanXp, attribute: cleanXp > 0 ? 'spirit' : null,
            hp: regen - damage, label: 'Juicio diario', meta: { ...day, missed: missed.map(h => h.name) },
        });
        if (!ev) continue;

        g.set({ combo, shields });
        for (const q of overdueQuests.filter(q => q.deadline === date)) {
            const gold = computeQuestOverduePenalty(q, mode);
            const inserted = await g.insert({ type: 'overdue', sourceId: q.id, date, gold: -gold, label: `Vencida: ${q.title}` });
            if (inserted) day.overdue += gold;
        }

        const before = g.deltas.length;
        await g.applyHp(regen - damage, date);
        day.death = g.deltas.length > before;
        report.push(day);
    }

    g.set({ lastJudgedDate: yesterday });
    return { report, game: await g.finish() };
}
