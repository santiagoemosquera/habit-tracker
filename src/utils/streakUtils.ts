import { Habit, HabitLog } from '../types';
import { differenceInDays, differenceInCalendarWeeks, differenceInCalendarMonths, parseISO, startOfDay, isSameDay, isSameWeek, isSameMonth, subDays, subWeeks, subMonths } from 'date-fns';
import { parseLocalDate } from './dateHelpers';

export function calculateStreak(habit: Habit, logs: HabitLog[]): number {
    if (!logs || logs.length === 0) return 0;

    // 1. Sort logs by date descending
    // Filter logs for this specific habit
    const habitLogs = logs
        .filter(log => log.habitId === habit.id)
        .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());

    if (habitLogs.length === 0) return 0;

    const today = startOfDay(new Date());

    // Helper to check if a specific period (day/week/month) is completed
    const isPeriodCompleted = (date: Date): boolean => {
        if (habit.frequency === 'daily') {
            // Find log for this day
            const log = habitLogs.find(l => isSameDay(parseLocalDate(l.date), date));
            if (!log) return false;

            if (habit.metricType === 'boolean') return log.value === 1;
            return log.value >= (habit.targetValue || 1);
        }
        else if (habit.frequency === 'weekly') {
            // Find all logs for this week
            const logsInWeek = habitLogs.filter(l => isSameWeek(parseISO(l.date), date, { weekStartsOn: 1 })); // Assuming Monday start
            // Sum values? Or count successful days?
            // Spec: "Una semana se considera 'completada' si se alcanza el objetivo semanal (ej: 3 de 3 veces)"
            // This implies counting distinct days with action, or sum of value?
            // "3 veces por semana" usually means 3 distinct days.
            // "30 pgs per day" is daily. 
            // If the goal is "3 times per week", we count how many logs exist in that week (or sum of booleans).
            // If metric is numeric (e.g. run 10km per week), we sum the value.

            // Interpretation:
            // If metric is boolean/custom with goal (e.g. 3 times), we count entries.
            // If metric is numeric (e.g. 500 mins), we sum values.
            // Let's assume 'goal' is the frequency target (count of days) for boolean/custom.

            if (habit.metricType === 'numeric') {
                const sum = logsInWeek.reduce((acc, curr) => acc + curr.value, 0);
                const weeklyTarget = (habit.targetValue || 1) * (habit.goal || 1);
                return sum >= weeklyTarget;
            } else {
                // Boolean/Custom: Goal is "X times per week"
                // We count unique days in that week that have activity
                const uniqueDays = new Set(logsInWeek.map(l => startOfDay(parseISO(l.date)).toISOString())).size;
                return uniqueDays >= (habit.goal || 1);
            }
        }
        else if (habit.frequency === 'monthly') {
            const logsInMonth = habitLogs.filter(l => isSameMonth(parseISO(l.date), date));
            if (habit.metricType === 'numeric') {
                const sum = logsInMonth.reduce((acc, curr) => acc + curr.value, 0);
                const monthlyTarget = (habit.targetValue || 1) * (habit.goal || 1);
                return sum >= monthlyTarget;
            } else {
                const uniqueDays = new Set(logsInMonth.map(l => startOfDay(parseISO(l.date)).toISOString())).size;
                return uniqueDays >= (habit.goal || 1);
            }
        }
        return false;
    };

    let streak = 0;
    // We need to walk backwards from "Current Period"
    // If today/this week/this month is NOT completed yet, we shouldn't break the streak immediately if it's the *current* incomplete period.
    // We start checking from appropriate anchor.

    let currentAnchor = today;

    // Logic: 
    // 1. Check if "current" unit is completed. If yes, streak++, move back.
    // 2. If no, check if it's "today" (or current week). If we are in the middle of current unit, it counts as "pending", not miss.
    //    So if pending, we skip counting it but don't break. We start check from previous unit.
    //    BUT if we missed *yesterday*, and today is pending, streak might be active but frozen.

    // Let's refine iteration strategy.
    // We iterate units backwards: 0 (current), 1 (prev), 2 (prev-prev)...

    let consecutiveMisses = 0;
    // Safety break
    for (let i = 0; i < 365 * 5; i++) {
        let dateToCheck: Date;
        if (habit.frequency === 'daily') dateToCheck = subDays(today, i);
        else if (habit.frequency === 'weekly') dateToCheck = subWeeks(today, i);
        else dateToCheck = subMonths(today, i);

        const completed = isPeriodCompleted(dateToCheck);

        if (completed) {
            streak++;
            consecutiveMisses = 0; // Reset gap count on hit
        } else {
            // Implementation of: "La racha SI se rompe si hay DOS días consecutivos sin cumplir"
            // And "La racha NO se rompe si hay UN solo día sin cumplir" 
            // If unit is TODAY (i==0) and strictly future/pending, we ignore?
            // Actually 'isPeriodCompleted' returns false for today if not done.
            // If i=0 (Today) is false, it's not a "miss" yet if we can still do it? 
            // Usually streaks show "Current streak" including today if done, or from yesterday if today pending.

            if (i === 0) {
                // If current period is not completed, we treat it as 'grace' (unless we want to verify strictly past).
                // But we assume the user might complete it.
                // We do NOT increment streak, but we do NOT count as miss?
                // Spec example: Day 0 (Done), Day 1 (Miss), Day 2 (Done).
                // If Today is Day 2 and Done: Streak = 2.
                // If Today is Day 2 and Not Done: Streak from Day 0?

                // Let's act as if i=0 is just a period.
                // If it is ignored (gap), consecutiveMisses = 1.
                // If consecutiveMisses reaches 2, break.
                consecutiveMisses++;
            } else {
                consecutiveMisses++;
            }
        }

        if (consecutiveMisses >= 2) {
            // If we have 2 misses in a row, the streak chain is broken.
            // However, we need to subtract the 'streak' accumulations that happened *before* the break?
            // Wait, we are walking backwards. 
            // Pattern: [Done, Miss, Done, Done] (Today <- Back)
            // i=0: Done (streak=1, miss=0)
            // i=1: Miss (streak=1, miss=1) -> Tolerated
            // i=2: Done (streak=2, miss=0)
            // i=3: Done (streak=3, miss=0)
            // Stop when? When history ends? Or when break found?

            // Pattern: [Done, Miss, Miss, Done]
            // i=0: Done (streak=1)
            // i=1: Miss (miss=1)
            // i=2: Miss (miss=2) -> BREAK.
            // So streak is 1. Correct.
            break;
        }
    }

    return streak;
}
