import { HabitLog } from '../types';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, getWeek, getMonth, isSameYear, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from './dateHelpers';

interface ChartDataPoint {
    name: string;
    value: number;
}

/**
 * Aggregates logs by day for the current week (or a specific week range).
 * Returns array of days (Lun, Mar, ...) with completion values.
 */
export const getWeeklyStats = (logs: HabitLog[], referenceDate: Date = new Date()): ChartDataPoint[] => {
    // Force Monday start to match "es" locale or user expectation
    const start = startOfWeek(referenceDate, { weekStartsOn: 1 }); // 1 = Monday
    const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        // Sum values for that day
        const dayLogs = logs.filter(l => isSameDay(parseLocalDate(l.date), day));
        const totalValue = dayLogs.reduce((acc, curr) => acc + Number(curr.value), 0);

        return {
            name: format(day, 'EEE', { locale: es }), // Lun, Mar
            value: totalValue
        };
    });
};

/**
 * Aggregates logs by week for the current month.
 * Returns array of weeks (Sem 1, Sem 2...) with total values.
 */
export const getMonthlyStats = (logs: HabitLog[], referenceDate: Date = new Date()): ChartDataPoint[] => {
    const start = startOfMonth(referenceDate);
    const end = endOfMonth(referenceDate);
    // Get all weeks in this month
    const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });

    return weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        // Filter logs within this week AND strictly within the month? 
        // User asked: "Semana 1, Semana 2". 
        // Simple approach: Check if log date is within this week interval.

        const weeklyValue = logs.reduce((acc, log) => {
            const logDate = parseLocalDate(log.date);
            // Check if logDate falls in this week
            if (logDate >= weekStart && logDate <= weekEnd) {
                return acc + log.value;
            }
            return acc;
        }, 0);

        return {
            name: `Sem ${index + 1}`,
            value: weeklyValue
        };
    });
};

/**
 * Aggregates logs by month for the current year.
 * Returns array of months (Ene, Feb...) with total values.
 */
export const getYearlyStats = (logs: HabitLog[], referenceDate: Date = new Date()): ChartDataPoint[] => {
    const start = startOfYear(referenceDate);
    const end = endOfYear(referenceDate);
    const months = eachMonthOfInterval({ start, end });

    return months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const monthlyValue = logs.reduce((acc, log) => {
            const logDate = parseLocalDate(log.date);
            if (logDate >= monthStart && logDate <= monthEnd) {
                return acc + log.value;
            }
            return acc;
        }, 0);

        return {
            name: format(month, 'MMM', { locale: es }),
            value: monthlyValue
        };
    });
};
