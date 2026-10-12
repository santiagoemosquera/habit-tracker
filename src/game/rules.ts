// Pure game rules shared by the API (server) and the UI (client).
// Keep this file free of runtime imports so it bundles cleanly on both sides.
import type {
    Attribute, BadSeverity, DifficultyMode, GoodDifficulty, LevelProgress, QuestSize,
} from '../types/game';

export const ATTRIBUTES: Record<Attribute, { label: string; icon: string; color: string; hint: string }> = {
    vitality: { label: 'Vitalidad', icon: '❤️', color: '#ef4444', hint: 'Ejercicio, sueño, alimentación' },
    intellect: { label: 'Intelecto', icon: '📘', color: '#3b82f6', hint: 'Lectura, estudio, idiomas' },
    discipline: { label: 'Disciplina', icon: '⚔️', color: '#f59e0b', hint: 'Trabajo profundo, orden, proyectos' },
    charisma: { label: 'Carisma', icon: '💬', color: '#ec4899', hint: 'Familia, amigos, networking' },
    spirit: { label: 'Espíritu', icon: '🧘', color: '#8b5cf6', hint: 'Meditación, journaling, días limpios' },
};

export const ATTRIBUTE_KEYS = Object.keys(ATTRIBUTES) as Attribute[];

const CATEGORY_KEYWORDS: Record<Attribute, string[]> = {
    vitality: ['salud', 'health', 'fitness', 'gym', 'deporte', 'sport', 'ejercicio', 'cuerpo', 'body', 'nutri', 'sueño', 'sleep'],
    intellect: ['mente', 'mind', 'estudio', 'study', 'lectura', 'read', 'aprend', 'learn', 'idioma', 'curso'],
    discipline: ['trabajo', 'work', 'producti', 'proyecto', 'project', 'orden', 'finanz', 'casa', 'home'],
    charisma: ['social', 'famil', 'amig', 'friend', 'pareja', 'network', 'relacion'],
    spirit: ['bienestar', 'mindful', 'spirit', 'espiritu', 'espíritu', 'medit', 'journal', 'wellbeing'],
};

export const GOOD_PRESETS: Record<GoodDifficulty, { label: string; xp: number; gold: number; hp: number; hint: string }> = {
    trivial: { label: 'Trivial', xp: 5, gold: 2, hp: 2, hint: '< 5 min, casi automático' },
    easy: { label: 'Fácil', xp: 10, gold: 5, hp: 4, hint: '5–15 min' },
    medium: { label: 'Media', xp: 20, gold: 10, hp: 7, hint: '15–45 min o cuesta arrancar' },
    hard: { label: 'Difícil', xp: 35, gold: 18, hp: 10, hint: '> 45 min o mucha resistencia' },
};

export const BAD_PRESETS: Record<BadSeverity, { label: string; gold: number; hp: number; hint: string }> = {
    light: { label: 'Leve', gold: 5, hp: 5, hint: 'Redes de más, snack fuera de horario' },
    medium: { label: 'Media', gold: 15, hp: 10, hint: 'Comida chatarra, procrastinar 1h' },
    severe: { label: 'Grave', gold: 40, hp: 20, hint: 'Fumar, apostar, borrachera' },
};

export const QUEST_PRESETS: Record<QuestSize, { label: string; xp: number; gold: number; hint: string }> = {
    small: { label: 'Pequeña', xp: 30, gold: 15, hint: 'Pagar una factura, llamar al médico' },
    medium: { label: 'Mediana', xp: 75, gold: 40, hint: 'Ordenar el placard, un trámite' },
    large: { label: 'Grande', xp: 200, gold: 100, hint: 'Terminar un curso, una mudanza' },
    epic: { label: 'Épica', xp: 500, gold: 250, hint: 'Lanzar un proyecto, una media maratón' },
};

export interface ModeConfig {
    label: string;
    description: string;
    reward: number;        // multiplier for XP / gold earned
    penalty: number;       // multiplier for gold / HP lost to bad habits
    missedDaily: number;   // multiplier for HP damage of missed dailies (0 = none)
    deathGoldPct: number;  // share of gold lost on defeat
    deathResetsCombo: boolean;
    deathLosesLevel: boolean;
}

export const MODES: Record<DifficultyMode, ModeConfig> = {
    relaxed: {
        label: 'Relajado', description: 'Castigos a la mitad y sin daño por dailies incumplidas.',
        reward: 1, penalty: 0.5, missedDaily: 0, deathGoldPct: 0.1, deathResetsCombo: false, deathLosesLevel: false,
    },
    normal: {
        label: 'Normal', description: 'Recomendado para empezar. Equilibrio entre premio y castigo.',
        reward: 1, penalty: 1, missedDaily: 1, deathGoldPct: 0.2, deathResetsCombo: true, deathLosesLevel: false,
    },
    hard: {
        label: 'Difícil', description: '+20% de premios, castigos ×1.5. Para cuando nunca bajás de 70% HP.',
        reward: 1.2, penalty: 1.5, missedDaily: 1.5, deathGoldPct: 0.3, deathResetsCombo: true, deathLosesLevel: false,
    },
    hardcore: {
        label: 'Hardcore', description: '+50% de premios, castigos ×2. Morir te quita un nivel.',
        reward: 1.5, penalty: 2, missedDaily: 2, deathGoldPct: 0.5, deathResetsCombo: true, deathLosesLevel: true,
    },
};

export const CRIT_CHANCE = 0.15;
export const DROP_CHANCE = 0.05;
export const DROP_MIN = 10;
export const DROP_MAX = 30;
export const PERFECT_DAY = { xp: 50, gold: 25, regen: 10 };
export const CLEAN_DAY_XP = 5;
export const QUEST_STEP_XP = 5;
export const QUEST_EARLY_BONUS = 0.25;
export const QUEST_OVERDUE_PCT = 0.1;
export const COMBO_THRESHOLD = 0.8;
// Going past a numeric target: +50% of the base reward per extra "target" done, up to +200% (x3 total)
export const OVERACHIEVE_RATE = 0.5;
export const OVERACHIEVE_CAP = 2;
export const MAX_JUDGED_DAYS = 30;

export const SHOP_ITEMS = {
    potion: { name: 'Poción', emoji: '🧪', cost: 30, hp: 25, note: '+25 HP' },
    shield: { name: 'Escudo de racha', emoji: '🛡️', cost: 80, max: 2, note: 'Protege tu combo un día (máx 2)' },
} as const;
export type ShopItem = keyof typeof SHOP_ITEMS;

export const LEVEL_TITLES: { level: number; title: string }[] = [
    { level: 40, title: 'Leyenda' },
    { level: 30, title: 'Maestro' },
    { level: 20, title: 'Héroe' },
    { level: 15, title: 'Veterano' },
    { level: 10, title: 'Aventurero' },
    { level: 5, title: 'Aprendiz' },
    { level: 1, title: 'Novato' },
];

// --- Progression ---

/** XP needed to go from level n to n+1. */
export const xpToNext = (level: number) => Math.round(100 * Math.pow(level, 1.5));

export function levelFromXp(totalXp: number): LevelProgress {
    let level = 1;
    let remaining = Math.max(0, totalXp);
    while (remaining >= xpToNext(level)) {
        remaining -= xpToNext(level);
        level++;
    }
    return { xp: totalXp, level, xpIntoLevel: remaining, xpForNext: xpToNext(level) };
}

export const titleForLevel = (level: number) =>
    (LEVEL_TITLES.find(t => level >= t.level) ?? LEVEL_TITLES[LEVEL_TITLES.length - 1]).title;

export const maxHp = (level: number) => 100 + 5 * (level - 1);

export const comboMultiplier = (combo: number) => 1 + 0.05 * Math.min(Math.max(combo, 0), 20);

// --- Habits ---

export interface GameHabit {
    id: string;
    name: string;
    category?: string | null;
    kind?: string | null;
    difficulty?: string | null;
    attribute?: string | null;
    customXp?: number | null;
    customGold?: number | null;
    customHp?: number | null;
    frequency: string;
    metricType: string;
    targetValue: number;
    goal: number;
    activeDays?: string | null;
    minValue?: number | null;
}

export function attributeForCategory(category?: string | null): Attribute {
    const c = (category || '').toLowerCase();
    for (const attr of ATTRIBUTE_KEYS) {
        if (CATEGORY_KEYWORDS[attr].some(k => c.includes(k))) return attr;
    }
    return 'discipline';
}

export function attributeForHabit(habit: Pick<GameHabit, 'attribute' | 'category'>): Attribute {
    if (habit.attribute && habit.attribute in ATTRIBUTES) return habit.attribute as Attribute;
    return attributeForCategory(habit.category);
}

export const isBadHabit = (habit: Pick<GameHabit, 'kind'>) => habit.kind === 'bad';

export const WEEKDAYS = [
    { day: 1, short: 'L', label: 'Lun' },
    { day: 2, short: 'M', label: 'Mar' },
    { day: 3, short: 'X', label: 'Mié' },
    { day: 4, short: 'J', label: 'Jue' },
    { day: 5, short: 'V', label: 'Vie' },
    { day: 6, short: 'S', label: 'Sáb' },
    { day: 0, short: 'D', label: 'Dom' },
];
export const WORKDAYS = '1,2,3,4,5';

/** Weekdays (0=Sun..6=Sat) a daily habit is due on; null = every day. */
export function parseActiveDays(activeDays?: string | null): number[] | null {
    if (!activeDays) return null;
    const days = activeDays.split(',').map(Number).filter(n => n >= 0 && n <= 6);
    return days.length === 0 || days.length === 7 ? null : days;
}

export function describeActiveDays(activeDays?: string | null) {
    const days = parseActiveDays(activeDays);
    if (!days) return 'Todos los días';
    if ([...days].sort().join(',') === WORKDAYS) return 'Lun–Vie';
    return WEEKDAYS.filter(w => days.includes(w.day)).map(w => w.label).join(', ');
}

/** Whether a daily habit is due on a YYYY-MM-DD date (rest days don't count as misses). */
export function isActiveOn(habit: Pick<GameHabit, 'activeDays'>, date: string) {
    const days = parseActiveDays(habit.activeDays);
    if (!days) return true;
    const [y, m, d] = date.split('-').map(Number);
    return days.includes(new Date(y, m - 1, d).getDay());
}

/** Base values for a habit: its custom overrides, or the preset of its difficulty. */
export function resolveHabitValues(habit: GameHabit) {
    if (isBadHabit(habit)) {
        const preset = BAD_PRESETS[(habit.difficulty as BadSeverity)] ?? BAD_PRESETS.medium;
        return { xp: 0, gold: habit.customGold ?? preset.gold, hp: habit.customHp ?? preset.hp };
    }
    const preset = GOOD_PRESETS[(habit.difficulty as GoodDifficulty)] ?? GOOD_PRESETS.easy;
    return {
        xp: habit.customXp ?? preset.xp,
        gold: habit.customGold ?? preset.gold,
        hp: habit.customHp ?? preset.hp,
    };
}

/** Whether a single log value reaches the target (earns the reward). */
export function isLogCompleted(habit: Pick<GameHabit, 'metricType' | 'targetValue'>, value: number) {
    if (habit.metricType === 'boolean') return value >= 1;
    return value >= (habit.targetValue || 1);
}

export type LogTier = 'none' | 'partial' | 'minimum' | 'full';

/** Minimum viable value of a numeric habit, if it has a valid one (below the target). */
export function minimumOf(habit: Pick<GameHabit, 'metricType' | 'targetValue' | 'minValue'>) {
    if (habit.metricType === 'boolean' || !habit.minValue || habit.minValue <= 0) return null;
    return habit.minValue < (habit.targetValue || 1) ? habit.minValue : null;
}

export function logTier(habit: Pick<GameHabit, 'metricType' | 'targetValue' | 'minValue'>, value: number): LogTier {
    if (value <= 0) return 'none';
    if (isLogCompleted(habit, value)) return 'full';
    const min = minimumOf(habit);
    return min !== null && value >= min ? 'minimum' : 'partial';
}

/** Minimum viable or better: no damage and the streak/combo holds, even without reward. */
export const isLogSatisfied = (habit: Pick<GameHabit, 'metricType' | 'targetValue' | 'minValue'>, value: number) => {
    const tier = logTier(habit, value);
    return tier === 'full' || tier === 'minimum';
};

/** Extra share of the base reward for going past the target (0..OVERACHIEVE_CAP). */
export function overachieveRatio(habit: Pick<GameHabit, 'metricType' | 'targetValue'>, value: number) {
    if (habit.metricType === 'boolean') return 0;
    const target = habit.targetValue || 1;
    const extra = value - target;
    return extra > 0 ? Math.min(OVERACHIEVE_CAP, OVERACHIEVE_RATE * (extra / target)) : 0;
}

// Deterministic RNG so re-toggling a habit can't re-roll crits.
export function seededRandom(seed: string) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    let a = h >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Reward for a logged value: nothing below the target, base (+crit/drop) at it, plus a bonus past it. */
export function computeHabitReward(habit: GameHabit, date: string, combo: number, mode: DifficultyMode, value = habit.targetValue || 1) {
    if (!isLogCompleted(habit, value)) return { xp: 0, gold: 0, crit: false, drop: 0, bonusXp: 0, bonusGold: 0 };
    const base = resolveHabitValues(habit);
    const mult = comboMultiplier(combo) * MODES[mode].reward;
    const rng = seededRandom(`${habit.id}:${date}`);
    const crit = rng() < CRIT_CHANCE;
    const dropRoll = rng() < DROP_CHANCE;
    const drop = dropRoll ? DROP_MIN + Math.floor(rng() * (DROP_MAX - DROP_MIN + 1)) : 0;
    const gold = Math.round(base.gold * mult) * (crit ? 2 : 1);
    const ratio = overachieveRatio(habit, value);
    const bonusXp = Math.round(base.xp * mult * ratio);
    const bonusGold = Math.round(base.gold * mult * ratio);
    return { xp: Math.round(base.xp * mult) + bonusXp, gold: gold + drop + bonusGold, crit, drop, bonusXp, bonusGold };
}

/** Reward a value is worth without luck (no crit/drop): used for previews on the cards. */
export function expectedHabitReward(habit: GameHabit, combo: number, mode: DifficultyMode, value: number) {
    if (!isLogCompleted(habit, value)) return { xp: 0, gold: 0 };
    const base = resolveHabitValues(habit);
    const mult = comboMultiplier(combo) * MODES[mode].reward;
    const ratio = overachieveRatio(habit, value);
    return {
        xp: Math.round(base.xp * mult) + Math.round(base.xp * mult * ratio),
        gold: Math.round(base.gold * mult) + Math.round(base.gold * mult * ratio),
    };
}

export function computeHabitGoalBonus(habit: GameHabit, mode: DifficultyMode) {
    const base = resolveHabitValues(habit);
    return { xp: Math.round(base.xp * MODES[mode].reward), gold: Math.round(base.gold * MODES[mode].reward) };
}

export function computeBadHabitPenalty(habit: GameHabit, mode: DifficultyMode) {
    const base = resolveHabitValues(habit);
    const mult = MODES[mode].penalty;
    return { gold: Math.round(base.gold * mult), hp: Math.round(base.hp * mult) };
}

export function computeMissedDailyDamage(habit: GameHabit, mode: DifficultyMode) {
    return Math.round(resolveHabitValues(habit).hp * MODES[mode].missedDaily);
}

// --- Quests ---

export interface GameQuest {
    size: string;
    customXp?: number | null;
    customGold?: number | null;
    deadline?: string | null;
}

export function resolveQuestValues(quest: GameQuest) {
    const preset = QUEST_PRESETS[quest.size as QuestSize] ?? QUEST_PRESETS.small;
    return { xp: quest.customXp ?? preset.xp, gold: quest.customGold ?? preset.gold };
}

export function computeQuestReward(quest: GameQuest, today: string, mode: DifficultyMode) {
    const base = resolveQuestValues(quest);
    const onTime = !!quest.deadline && today <= quest.deadline;
    const mult = MODES[mode].reward * (onTime ? 1 + QUEST_EARLY_BONUS : 1);
    return { xp: Math.round(base.xp * mult), gold: Math.round(base.gold * mult), onTime };
}

export const computeQuestStepXp = (mode: DifficultyMode) => Math.round(QUEST_STEP_XP * MODES[mode].reward);

export const computeQuestOverduePenalty = (quest: GameQuest, mode: DifficultyMode) =>
    Math.round(resolveQuestValues(quest).gold * QUEST_OVERDUE_PCT * MODES[mode].penalty);
