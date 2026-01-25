import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isToday, getDay, parseISO, addMonths, subMonths, isSameMonth, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '../utils/cn';
import { Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import { Habit, HabitLog } from '../types';

interface MonthCalendarProps {
    habit: Habit;
    logs: HabitLog[];
    currentDate?: Date; // Initial date
    onDayClick?: (date: Date) => void;
    selectedDate?: Date;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({ habit, logs, currentDate: initialDate = new Date(), onDayClick, selectedDate }) => {
    const [currentMonth, setCurrentMonth] = useState(initialDate);
    const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

    // Navigation
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextYear = () => setCurrentMonth(addMonths(currentMonth, 12));
    const prevYear = () => setCurrentMonth(subMonths(currentMonth, 12));

    const getDayStatus = (date: Date) => {
        const log = logs.find(l => isSameDay(parseISO(l.date), date));
        if (!log) return 'empty';
        if (habit.metricType === 'boolean') return log.value === 1 ? 'completed' : 'failed';
        return log.value >= habit.targetValue ? 'completed' : 'partial';
    };

    const renderMonthView = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const startDay = getDay(monthStart); // 0 = Sun, 1 = Mon...
        // We want Mon (1) to be col 0. Sun (0) to be col 6.
        // Formula: (day + 6) % 7
        const paddingCols = (startDay + 6) % 7;
        const paddingDays = Array(paddingCols).fill(null);

        return (
            <div className="animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft size={20} /></button>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => setViewMode('year')}>
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </h4>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight size={20} /></button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                        <div key={d} className="text-xs font-bold text-slate-400">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {paddingDays.length > 0 && paddingDays.map((_, i) => <div key={`pad-${i}`} />)}
                    {days.map(day => {
                        const status = getDayStatus(day);
                        const isDayToday = isToday(day);
                        const isSelected = selectedDate && isSameDay(selectedDate, day);

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => onDayClick?.(day)}
                                className={cn(
                                    "aspect-square rounded-md flex items-center justify-center text-xs relative group transition-all hover:bg-indigo-50 dark:hover:bg-zinc-800",
                                    isSelected && "ring-2 ring-indigo-600 ring-offset-2 z-20",
                                    !isSelected && isDayToday && "ring-2 ring-indigo-300 ring-offset-1 z-10",
                                    status === 'completed' && "bg-green-500 text-white hover:bg-green-600",
                                    status === 'partial' && "bg-green-200 text-green-800 hover:bg-green-300",
                                    status === 'empty' && "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-400"
                                )}
                            >
                                <span className="z-10">{format(day, 'd')}</span>
                                {status === 'completed' && <Check size={10} className="absolute inset-0 m-auto opacity-50" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderYearView = () => {
        const start = startOfYear(currentMonth);
        const end = endOfYear(currentMonth);
        const months = eachMonthOfInterval({ start, end });

        return (
            <div className="animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevYear} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronsLeft size={20} /></button>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:text-indigo-500 transition-colors" onClick={() => setViewMode('month')}>
                        {format(currentMonth, 'yyyy')}
                    </h4>
                    <button onClick={nextYear} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronsRight size={20} /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {months.map(month => {
                        const isCurrentMonth = isSameMonth(month, new Date());
                        return (
                            <button
                                key={month.toISOString()}
                                onClick={() => { setCurrentMonth(month); setViewMode('month'); }}
                                className={cn(
                                    "p-3 rounded-xl border text-sm font-medium capitalize hover:border-indigo-500 hover:text-indigo-500 transition-all",
                                    isCurrentMonth ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-slate-400"
                                )}
                            >
                                {format(month, 'MMM', { locale: es })}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    };

    return (
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl mt-4">
            {viewMode === 'month' ? renderMonthView() : renderYearView()}
        </div>
    );
};

export default MonthCalendar;
