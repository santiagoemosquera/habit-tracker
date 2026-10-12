import { Habit, HabitLog } from '../types';
import { startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, isSameDay, getWeek, endOfWeek, isSameMonth, format } from 'date-fns';
import { parseLocalDate } from './dateHelpers';
import { isActiveOn } from '../game/rules';

/**
 * Calculates the compliance percentage for a habit within a given month.
 * 
 * - Daily habits: (Days completed / Total days in month) * 100
 * - Weekly habits: (Weeks meeting goal / Total weeks in month) * 100
 * - Monthly habits: (Met goal ? 100 : 0) -- Simplified
 */
export const calculateMonthlyCompliance = (habit: Habit, logs: HabitLog[], referenceDate: Date = new Date()): number => {
    const monthStart = startOfMonth(referenceDate);
    const monthEnd = endOfMonth(referenceDate);

    // Filter logs for this month
    const monthLogs = logs.filter(l => isSameMonth(parseLocalDate(l.date), referenceDate));

    if (habit.frequency === 'daily') {
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
            .filter(day => isActiveOn(habit, format(day, 'yyyy-MM-dd')));
        if (days.length === 0) return 0;
        // Count days where target was met
        const successfulDays = days.reduce((count, day) => {
            const log = monthLogs.find(l => isSameDay(parseLocalDate(l.date), day));
            // Check if log exists and meets target
            if (log) {
                if (habit.metricType === 'boolean') {
                    if (log.value >= 1) return count + 1;
                } else {
                    if (log.value >= habit.targetValue) return count + 1;
                }
            }
            return count;
        }, 0);

        return Math.round((successfulDays / days.length) * 100);
    }
    else if (habit.frequency === 'weekly') {
        const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

        const successfulWeeks = weeks.reduce((count, weekStart) => {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

            // Sum all values for this week (only filtering logs that fall in this week AND this month)
            // Note: edge case where week starts in prev month or ends in next.
            // We usually count activity for the week regardless of month boundary if we are strict about "weekly goal".
            // However, to be strict "this month", maybe we only count logs in this month?
            // "Gym 3x a week" -> Did I go 3 times this week? Yes. 
            // Let's count totals for the week.

            const weeklyTotal = logs.reduce((sum, log) => {
                const d = parseLocalDate(log.date);
                if (d >= weekStart && d <= weekEnd) {
                    return sum + log.value; // Summing up completions logic (1 per boolean is 1)
                }
                return sum;
            }, 0);

            if (weeklyTotal >= habit.goal) {
                return count + 1;
            }
            return count;
        }, 0);

        return Math.round((successfulWeeks / weeks.length) * 100);
    }
    else {
        // Monthly
        // Just check total for month
        const total = monthLogs.reduce((acc, l) => acc + l.value, 0);
        return total >= habit.goal ? 100 : 0;
    }
};
