import React, { useState } from 'react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import { ArrowLeft, Flame, Calendar as CalendarIcon, Trophy, Target } from 'lucide-react';
import { cn } from '../utils/cn';
import MonthCalendar from '../components/CalendarView';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getWeeklyStats, getMonthlyStats, getYearlyStats } from '../utils/chartUtils';
import { calculateMonthlyCompliance } from '../utils/statsUtils';

type Tab = 'week' | 'month' | 'year';

const HabitDetailView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { habits, logs, getHabitStats, toggleHabitCompletion } = useHabits();
    const [activeTab, setActiveTab] = useState<Tab>('month');

    const habit = habits.find(h => h.id === id);

    if (!habit) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500">Habit not found</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-500">Go Back</button>
            </div>
        );
    }

    const stats = getHabitStats(habit.id);
    const habitLogs = logs.filter(l => l.habitId === habit.id);
    const compliance = calculateMonthlyCompliance(habit, habitLogs);

    // Dynamic Chart Data
    let chartData;
    switch (activeTab) {
        case 'week':
            chartData = getWeeklyStats(habitLogs);
            break;
        case 'month':
            chartData = getMonthlyStats(habitLogs);
            break;
        case 'year':
            chartData = getYearlyStats(habitLogs);
            break;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 pb-24">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-[#09090b] border-b border-slate-100 dark:border-zinc-800 px-4 py-4 flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">{habit.name}</h1>
            </div>

            <div className="p-4 space-y-6">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 text-orange-500 rounded-full">
                            <Flame size={20} className="fill-current" />
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold">{stats.currentStreak}</span>
                            <span className="text-xs text-slate-400">Racha Actual</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-2">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-500 rounded-full">
                            <Trophy size={20} className="fill-current" />
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold">{stats.longestStreak}</span>
                            <span className="text-xs text-slate-400">Mejor Racha</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-500 rounded-full">
                            <Target size={20} />
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold">{stats.totalCompletions}</span>
                            <span className="text-xs text-slate-400">Total</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col items-center justify-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-500 rounded-full">
                            <CalendarIcon size={20} />
                        </div>
                        <div className="text-center">
                            <span className="block text-2xl font-bold">{compliance}%</span>
                            <span className="text-xs text-slate-400">Este Mes</span>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold">Rendimiento</h3>
                        <div className="flex bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
                            {(['week', 'month', 'year'] as Tab[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "px-3 py-1 text-xs font-medium rounded-md transition-all capitalize",
                                        activeTab === tab
                                            ? "bg-white dark:bg-zinc-700 shadow-sm text-slate-900 dark:text-white"
                                            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    )}
                                >
                                    {tab === 'week' ? 'Semana' : tab === 'month' ? 'Mes' : 'Año'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="value"
                                    fill="#f43f5e"
                                    radius={[4, 4, 4, 4]}
                                    barSize={32}
                                // Using the rose color from screenshot or user pref blue? 
                                // User selected Blue. Let's switch to blue-500 (#3b82f6)
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-6">
                    <h3 className="font-bold mb-4">Historial</h3>
                    <MonthCalendar
                        habit={habit}
                        logs={logs.filter(l => l.habitId === habit.id)}
                        onDayClick={(date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const log = logs.find(l => l.habitId === habit.id && l.date === dateStr);

                            if (log) {
                                // Direct delete without confirm for smoother UX, or keep confirm if preferred. 
                                // User asked for "ability to delete". 
                                toggleHabitCompletion(habit.id, dateStr, 0);
                            } else {
                                toggleHabitCompletion(habit.id, dateStr, habit.metricType === 'boolean' ? 1 : habit.targetValue);
                            }
                        }}
                    />
                </div>

            </div>
        </div>
    );
};

export default HabitDetailView;
