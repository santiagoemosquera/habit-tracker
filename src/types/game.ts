export type Attribute = 'vitality' | 'intellect' | 'discipline' | 'charisma' | 'spirit';

export type HabitKind = 'good' | 'bad';
export type GoodDifficulty = 'trivial' | 'easy' | 'medium' | 'hard';
export type BadSeverity = 'light' | 'medium' | 'severe';
export type QuestSize = 'small' | 'medium' | 'large' | 'epic';
export type DifficultyMode = 'relaxed' | 'normal' | 'hard' | 'hardcore';

export type GameEventType =
    | 'habit'
    | 'habit_goal'
    | 'bad_habit'
    | 'perfect_day'
    | 'quest'
    | 'quest_step'
    | 'overdue'
    | 'purchase'
    | 'potion'
    | 'shield'
    | 'judgment'
    | 'death';

export interface GameEvent {
    id: string;
    type: GameEventType;
    sourceId: string | null;
    date: string;
    xp: number;
    gold: number;
    hp: number;
    attribute: Attribute | null;
    label: string | null;
    meta: Record<string, any> | null;
    createdAt: string;
}

export interface LevelProgress {
    xp: number;
    level: number;
    xpIntoLevel: number;
    xpForNext: number;
}

export interface PlayerState extends LevelProgress {
    gold: number;
    hp: number;
    maxHp: number;
    combo: number;
    comboMultiplier: number;
    shields: number;
    mode: DifficultyMode;
    title: string;
    attributes: Record<Attribute, LevelProgress>;
    lastJudgedDate: string | null;
}

// A single change shown to the user as a toast
export interface GameDelta {
    label: string;
    xp: number;
    gold: number;
    hp: number;
    attribute?: Attribute | null;
    crit?: boolean;
    drop?: number;
    tone: 'reward' | 'penalty' | 'revert' | 'info';
}

export interface GamePayload {
    deltas: GameDelta[];
    player: PlayerState;
}

export interface JudgmentDay {
    date: string;
    completed: number;
    total: number;
    damage: number;
    regen: number;
    cleanDays: number;
    cleanXp: number;
    comboAfter: number;
    comboBroken: boolean;
    shieldUsed: boolean;
    perfect: boolean;
    death: boolean;
    overdue: number;
    minimums: number;
}

export interface Reward {
    id: string;
    name: string;
    emoji: string;
    cost: number;
    note: string | null;
    archived: boolean;
}

export interface QuestStep {
    id: string;
    questId: string;
    title: string;
    done: boolean;
    order: number;
}

export interface Quest {
    id: string;
    title: string;
    notes: string | null;
    size: QuestSize;
    attribute: Attribute | null;
    deadline: string | null;
    customXp: number | null;
    customGold: number | null;
    penalizeOverdue: boolean;
    status: 'open' | 'done';
    completedAt: string | null;
    createdAt: string;
    steps: QuestStep[];
}
