import React, { useRef, useState } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { CalendarDays, GripVertical, Settings, Trash2, Undo2, Skull, ShieldCheck } from 'lucide-react';
import { Habit } from '../types';
import { useHabits } from '../context/HabitContext';
import { useGame } from '../context/GameContext';
import { BAD_PRESETS, computeBadHabitPenalty } from '../game/rules';
import type { BadSeverity } from '../types/game';
import { cn } from '../utils/cn';
import { parseLocalDate } from '../utils/dateHelpers';
import AddHabitModal from './AddHabitModal';
import DeltaChips from './game/DeltaChips';

interface BadHabitCardProps {
    habit: Habit;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    isDragOver?: boolean;
}

const BadHabitCard: React.FC<BadHabitCardProps> = ({ habit, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver }) => {
    const { logs, toggleHabitCompletion, deleteHabit } = useHabits();
    const { player } = useGame();
    const [showEditModal, setShowEditModal] = useState(false);

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    // Relapses can be logged on past days too (like good habits)
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const dateInput = useRef<HTMLInputElement>(null);
    const isToday = selectedDate === todayStr;
    const dayLabel = isToday ? 'hoy' : `el ${format(parseLocalDate(selectedDate), "d 'de' MMM", { locale: es })}`;

    const habitLogs = logs.filter(l => l.habitId === habit.id && l.value > 0);
    const slipsOnDate = habitLogs.find(l => l.date === selectedDate)?.value ?? 0;
    const penalty = computeBadHabitPenalty(habit, player?.mode ?? 'normal');
    const severity = BAD_PRESETS[habit.difficulty as BadSeverity] ?? BAD_PRESETS.medium;

    // Consecutive days (up to today) without a relapse, since the habit was created
    const slipDates = new Set(habitLogs.map(l => l.date));
    const createdStr = habit.createdAt ? format(new Date(habit.createdAt), 'yyyy-MM-dd') : todayStr;
    let cleanDays = 0;
    for (let i = 0; i < 365; i++) {
        const d = format(subDays(today, i), 'yyyy-MM-dd');
        if (d < createdStr || slipDates.has(d)) break;
        cleanDays++;
    }

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "bg-white dark:bg-zinc-900 rounded-2xl p-5 border shadow-sm transition-shadow hover:shadow-md group",
                    slipsOnDate > 0 ? "border-rose-200 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900" : "border-slate-200 dark:border-zinc-800",
                    !isToday && "ring-2 ring-rose-100 dark:ring-rose-900",
                    isDragOver && "ring-2 ring-rose-400"
                )}
                onDragOver={onDragOver}
                onDrop={onDrop}
            >
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                draggable
                                onDragStart={onDragStart}
                                onDragEnd={onDragEnd}
                                className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-zinc-700 dark:hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity -ml-1"
                                title="Arrastrar para reordenar"
                            >
                                <GripVertical size={16} />
                            </span>
                            <Skull size={16} className="text-rose-500 flex-shrink-0" />
                            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 truncate">{habit.name}</h3>
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                                title="Settings"
                            >
                                <Settings size={14} />
                            </button>
                            <button
                                onClick={() => {
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
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">{severity.label}</span>
                            <DeltaChips gold={-penalty.gold} hp={-penalty.hp} suffix="por recaída" />
                        </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-1">
                        <button
                            onClick={() => dateInput.current?.showPicker()}
                            className={cn(
                                "p-2 rounded-xl transition-colors",
                                isToday ? "text-slate-300 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-zinc-800" : "text-rose-600 bg-rose-50 dark:bg-rose-500/10"
                            )}
                            title="Registrar en otro día"
                        >
                            <CalendarDays size={18} />
                        </button>
                        <input
                            ref={dateInput}
                            type="date"
                            max={todayStr}
                            value={selectedDate}
                            onChange={e => e.target.value && setSelectedDate(e.target.value > todayStr ? todayStr : e.target.value)}
                            className="sr-only"
                            tabIndex={-1}
                            aria-label="Fecha de la recaída"
                        />
                        <button
                            onClick={() => toggleHabitCompletion(habit.id, selectedDate, slipsOnDate + 1)}
                            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
                        >
                            Caí
                        </button>
                    </div>
                </div>

                {!isToday && (
                    <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded">
                            Registrando: {format(parseLocalDate(selectedDate), "EEE d 'de' MMM", { locale: es })}
                        </span>
                        <button onClick={() => setSelectedDate(todayStr)} className="text-slate-400 hover:text-rose-600 underline">
                            Volver a hoy
                        </button>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between text-xs">
                    <span className={cn("flex items-center gap-1 font-bold", cleanDays > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400")}>
                        <ShieldCheck size={14} />
                        {cleanDays} {cleanDays === 1 ? 'día limpio' : 'días limpios'}
                    </span>
                    {slipsOnDate > 0 && (
                        <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold">
                            {slipsOnDate} {slipsOnDate === 1 ? 'recaída' : 'recaídas'} {dayLabel}
                            <button
                                onClick={() => toggleHabitCompletion(habit.id, selectedDate, slipsOnDate - 1)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
                                title="Deshacer la última recaída"
                            >
                                <Undo2 size={14} />
                            </button>
                        </span>
                    )}
                </div>
            </motion.div>

            {showEditModal && (
                <AddHabitModal onClose={() => setShowEditModal(false)} initialHabit={habit} />
            )}
        </>
    );
};

export default BadHabitCard;
