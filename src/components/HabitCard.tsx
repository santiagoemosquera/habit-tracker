import React, { useState } from 'react';
import { Habit } from '../types';
import { useHabits } from '../context/HabitContext';
import { Check, Flame, Plus, Minus, Calendar as CalendarIcon, ChevronDown, Trash2, Settings, GripVertical } from 'lucide-react';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MonthCalendar from './CalendarView';
import AddHabitModal from './AddHabitModal';
import DeltaChips from './game/DeltaChips';
import { useGame } from '../context/GameContext';
import { MODES, comboMultiplier, resolveHabitValues } from '../game/rules';

interface HabitCardProps {
    habit: Habit;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    isDragOver?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver }) => {
    const { toggleHabitCompletion, getHabitStats, logs, deleteHabit } = useHabits();
    const { player } = useGame();
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    // Sync with logs
    const today = new Date();
    const isTodaySelected = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

    const stats = getHabitStats(habit.id);

    // Expected reward before crits/drops, with the current combo and difficulty mode
    const base = resolveHabitValues(habit);
    const rewardMult = comboMultiplier(player?.combo ?? 0) * MODES[player?.mode ?? 'normal'].reward;
    const logForDate = logs.find(l => l.habitId === habit.id && l.date === selectedDateStr);
    const isCompletedForDate = logForDate ? (habit.metricType === 'boolean' ? logForDate.value === 1 : logForDate.value >= habit.targetValue) : false;
    // Use logForDate.value if exists, else 0
    const displayedVal = logForDate ? logForDate.value : 0;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (habit.metricType === 'boolean') {
            toggleHabitCompletion(habit.id, selectedDateStr, isCompletedForDate ? 0 : 1);
        }
    };

    const handleIncrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newVal = displayedVal + 1;
        toggleHabitCompletion(habit.id, selectedDateStr, newVal);
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newVal = Math.max(0, displayedVal - 1);
        if (newVal === 0) {
            toggleHabitCompletion(habit.id, selectedDateStr, 0);
        } else {
            toggleHabitCompletion(habit.id, selectedDateStr, newVal);
        }
    };

    const [showEditModal, setShowEditModal] = useState(false);

    // Local state for input to allow smooth typing
    // We update it when displayedVal changes (external sync)
    // But we don't automatically sync it BACK until blur/enter
    const [inputValue, setInputValue] = useState(displayedVal.toString());

    // Update local input if displayedVal changes externally (e.g. +/- buttons)
    React.useEffect(() => {
        setInputValue(displayedVal.toString());
    }, [displayedVal]);

    const handleInputBlur = () => {
        let val = parseInt(inputValue);
        if (isNaN(val) || val < 0) val = 0;
        if (val !== displayedVal) {
            toggleHabitCompletion(habit.id, selectedDateStr, val);
        }
        setInputValue(val.toString());
    };

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "bg-white dark:bg-zinc-900 rounded-2xl p-5 border shadow-sm transition-shadow hover:shadow-md cursor-pointer group", // Added group for hover effects
                    isCompletedForDate ? "border-green-200 bg-green-50/20 dark:bg-green-900/10 dark:border-green-800" : "border-slate-200 dark:border-zinc-800",
                    !isTodaySelected && "ring-2 ring-indigo-100 dark:ring-indigo-900", // Visual cue when editing history
                    isDragOver && "ring-2 ring-indigo-400"
                )}
                onClick={() => setIsExpanded(!isExpanded)}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                draggable
                                onClick={(e) => e.stopPropagation()}
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                                className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-zinc-700 dark:hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity -ml-1"
                                title="Arrastrar para reordenar"
                            >
                                <GripVertical size={16} />
                            </span>
                            <h3
                                onClick={(e) => { e.stopPropagation(); navigate(`/habits/${habit.id}`); }}
                                className="font-bold text-lg text-slate-800 dark:text-slate-100 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer underline decoration-dotted decoration-slate-300 hover:decoration-indigo-500"
                            >
                                {habit.name}
                            </h3>
                            {stats.currentStreak > 0 && (
                                <div className="flex items-center text-xs font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                                    <Flame size={12} className="mr-1 fill-orange-500" />
                                    {stats.currentStreak}
                                </div>
                            )}

                            {/* Edit Button (Visible on hover or expanded) */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                                title="Settings"
                            >
                                <Settings size={14} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`¿Eliminar el hábito "${habit.name}"? Esta acción no se puede deshacer.`)) {
                                        deleteHabit(habit.id);
                                    }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                                title="Eliminar hábito"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* Date status or habit details */}
                        {!isTodaySelected ? (
                            <div className="flex items-center gap-2 mb-1 animate-pulse">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                    Editing: {format(selectedDate, 'MMM d')}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedDate(new Date()); }}
                                    className="text-xs text-slate-400 hover:text-indigo-600 underline"
                                >
                                    Reset to Today
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm text-slate-500 capitalize flex items-center gap-2">
                                    {habit.frequency} • {habit.frequency === 'daily' ? `Goal: ${habit.targetValue} ${habit.unit || 'times'}` : `Goal: ${habit.goal}x / ${habit.frequency === 'weekly' ? 'week' : 'month'}`}
                                </p>
                                <DeltaChips
                                    xp={Math.round(base.xp * rewardMult)}
                                    gold={Math.round(base.gold * rewardMult)}
                                    className={cn(isCompletedForDate && "opacity-50")}
                                />
                            </div>
                        )}
                    </div>

                    {/* Simple Checkbox for Boolean */}
                    {habit.metricType === 'boolean' && (
                        <button
                            onClick={handleToggle}
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                                isCompletedForDate
                                    ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105"
                                    : "bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-slate-600 hover:bg-slate-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            <Check size={24} strokeWidth={3} />
                        </button>
                    )}
                </div>

                {/* Numeric Controls */}
                {habit.metricType !== 'boolean' && (
                    <div className="mt-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between bg-slate-100 dark:bg-zinc-800 rounded-xl p-1">
                            <button onClick={handleDecrement} className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300 disabled:opacity-50" disabled={displayedVal <= 0}>
                                <Minus size={16} />
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="flex items-baseline gap-1">
                                    <input
                                        type="number"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onBlur={handleInputBlur}
                                        onKeyDown={handleInputKeyDown}
                                        className="font-bold text-xl text-slate-800 dark:text-slate-100 w-16 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors"
                                    />
                                    <span className="text-xs text-slate-500 dark:text-slate-400">/ {habit.targetValue} {habit.unit}</span>
                                </div>
                            </div>

                            <button onClick={handleIncrement} className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-lg transition-colors text-slate-600 dark:text-slate-300">
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-500", isCompletedForDate ? "bg-green-500" : "bg-indigo-500")}
                                    style={{ width: `${Math.min(100, (displayedVal / habit.targetValue) * 100)}%` }}
                                />
                            </div>
                            {displayedVal > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('¿Seguro que quieres eliminar este registro?')) {
                                            toggleHabitCompletion(habit.id, selectedDateStr, 0);
                                        }
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Eliminar registro"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Expand Hint */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <span className="flex items-center gap-1"><CalendarIcon size={12} /> {stats.totalCompletions} completions</span>
                    <ChevronDown size={16} className={cn("transition-transform", isExpanded && "rotate-180")} />
                </div>

                {/* Expanded Content: Calendar */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                            onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
                        >
                            <div className="pt-4 border-t border-slate-100 mt-4">
                                <MonthCalendar
                                    habit={habit}
                                    logs={logs.filter(l => l.habitId === habit.id)}
                                    onDayClick={setSelectedDate}
                                    selectedDate={selectedDate}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Edit Modal */}
            {showEditModal && (
                <AddHabitModal
                    onClose={() => setShowEditModal(false)}
                    initialHabit={habit}
                />
            )}
        </>
    );
};

export default HabitCard;
