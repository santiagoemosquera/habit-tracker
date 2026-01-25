import React, { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useHabits } from '../context/HabitContext';
import { useTheme } from '../context/ThemeContext';
import { Check, Flame, Moon, Sun } from 'lucide-react';
import { cn } from '../utils/cn';

const TodayView = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { habits, logs, toggleHabitCompletion } = useHabits();
    const { theme, toggleTheme } = useTheme();

    // Generate range: Today - 7 days to Today + 4 days
    const dates = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 7 + i);
        return d;
    });

    const getDayName = (date: Date) => format(date, 'EEE', { locale: es });
    const getDayNumber = (date: Date) => format(date, 'd');

    // Filter habits for the selected date
    const filteredHabits = habits.filter(habit => {
        // For now, simple filter. Ideally check frequency.
        return true;
    });

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#09090b]">
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-4 bg-white dark:bg-[#09090b] sticky top-0 z-10 transition-colors duration-200">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold capitalize text-slate-900 dark:text-white">Hoy</h1>
                </div>
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </header>

            {/* Horizontal Calendar Strip */}
            <div className="flex overflow-x-auto pb-4 px-4 gap-2 no-scrollbar bg-white dark:bg-[#09090b] border-b border-transparent dark:border-transparent transition-colors duration-200">
                {dates.map((date) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());
                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[3.5rem] h-16 rounded-2xl transition-all duration-200 snap-center",
                                isSelected
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    : "bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-500 hover:bg-slate-200 dark:hover:bg-zinc-800",
                                isSelected ? "scale-105" : "scale-100"
                            )}
                        >
                            <span className="text-xs font-medium capitalize">{getDayName(date)}</span>
                            <span className="text-lg font-bold">{getDayNumber(date)}</span>
                            {isToday && !isSelected && (
                                <span className="w-1 h-1 rounded-full bg-blue-600 mt-1"></span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Habits List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                {filteredHabits.map(habit => {
                    const logEntry = logs.find(l => l.habitId === habit.id && isSameDay(new Date(l.date), selectedDate));
                    // Logic to check completion based on metric type
                    // Assuming HabitLog has value. We need habit to check metricType.
                    const isCompleted = logEntry ? (habit.metricType === 'boolean' ? logEntry.value >= 1 : logEntry.value >= (habit.targetValue || 1)) : false;

                    return (
                        <div key={habit.id} className="group relative flex items-center justify-between p-4 bg-white dark:bg-zinc-900/50 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm dark:shadow-none active:scale-[0.99] transition-all duration-200">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                    isCompleted ? "bg-blue-500/10 text-blue-500" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                                )}>
                                    <Flame size={20} className={isCompleted ? "fill-current" : ""} />
                                </div>
                                <div className="flex flex-col">
                                    <span className={cn("font-semibold text-base dark:text-zinc-100", isCompleted && "line-through text-slate-400 dark:text-zinc-500")}>{habit.name}</span>
                                    <span className="text-xs text-slate-400 dark:text-zinc-500 capitalize">{habit.frequency}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => toggleHabitCompletion(habit.id, format(selectedDate, 'yyyy-MM-dd'))}
                                className={cn(
                                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                    isCompleted
                                        ? "bg-blue-500 border-blue-500 text-white"
                                        : "border-slate-300 dark:border-zinc-700 text-transparent hover:border-blue-400 dark:hover:border-blue-500"
                                )}
                            >
                                <Check size={16} strokeWidth={3} />
                            </button>
                        </div>
                    );
                })}
                {filteredHabits.length === 0 && (
                    <div className="text-center py-10 text-slate-400 dark:text-zinc-600">
                        <p>No hay hábitos para este día.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodayView;
