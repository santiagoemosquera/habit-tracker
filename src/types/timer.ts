export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export interface TimerConfig {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number; // Number of pomodoros before long break
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high' | 'none';
    estimatedPomodoros: number;
    completedPomodoros: number;
    status: 'pending' | 'completed';
    deadline?: string; // ISO Date "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm"
    createdAt: number;
}
