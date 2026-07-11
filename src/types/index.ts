export type Frequency = 'daily' | 'weekly' | 'monthly';

export type MetricType = 'boolean' | 'numeric' | 'custom';

export interface Habit {
    id: string;
    name: string;
    description?: string;
    frequency: Frequency;
    goal: number; // e.g. 1 (for daily boolean), 3 (for weekly)
    metricType: MetricType;
    unit?: string; // e.g., "pages", "liters", "minutes"
    targetValue: number; // e.g. 1 (for boolean), 20 (pages)
    startDate: string; // ISO Date string
    order: number;
    archived: boolean;
    color?: string;
    icon?: string;
    category?: string; // e.g. "Health", "Mind", "Work"
}

export interface HabitLog {
    id: string; // unique log id (optional, maybe composite key better)
    habitId: string;
    date: string; // ISO Date string "YYYY-MM-DD"
    value: number; // 1 for completed boolean, or actual numeric value
    timestamp: number;
}

export interface HabitStats {
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    complianceRate: number; // 0-100
    lastCompletedDate: string | null;
}
