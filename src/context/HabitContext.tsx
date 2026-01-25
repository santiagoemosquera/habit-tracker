import React, { createContext, useContext, ReactNode } from 'react';
import { Habit, HabitLog, HabitStats } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { calculateStreak } from '../utils/streakUtils';

// Simple ID generator if uuid not available
const generateId = () => Math.random().toString(36).substr(2, 9);

interface HabitContextType {
    habits: Habit[];
    logs: HabitLog[];
    addHabit: (habit: Omit<Habit, 'id' | 'archived'>) => void;
    updateHabit: (id: string, updates: Partial<Habit>) => void;
    deleteHabit: (id: string) => void;
    renameCategory: (oldCategory: string, newCategory: string) => void;
    toggleHabitCompletion: (habitId: string, date: string, value?: number) => void;
    getHabitStats: (habitId: string) => HabitStats;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [habits, setHabits] = useLocalStorage<Habit[]>('habits', []);
    const [logs, setLogs] = useLocalStorage<HabitLog[]>('habit_logs', []);

    const addHabit = (habitData: Omit<Habit, 'id' | 'archived'>) => {
        const newHabit: Habit = {
            ...habitData,
            id: generateId(),
            archived: false,
        };
        setHabits([...habits, newHabit]);
    };

    const updateHabit = (id: string, updates: Partial<Habit>) => {
        setHabits(habits.map(h => (h.id === id ? { ...h, ...updates } : h)));
    };

    const deleteHabit = (id: string) => {
        setHabits(habits.filter(h => h.id !== id));
        setLogs(logs.filter(l => l.habitId !== id)); // Cleanup logs?
    };

    const renameCategory = (oldCategory: string, newCategory: string) => {
        setHabits(habits.map(h =>
            (h.category === oldCategory) ? { ...h, category: newCategory } : h
        ));
    };

    const toggleHabitCompletion = (habitId: string, date: string, value: number = 1) => {
        const existingLogIndex = logs.findIndex(l => l.habitId === habitId && l.date === date);

        if (existingLogIndex >= 0) {
            if (value === 0) {
                // Remove log if value is 0 (toggle off or clear)
                // Filter out the specific log entry
                setLogs(logs.filter((l) => !(l.habitId === habitId && l.date === date)));
            } else {
                // Update value
                const newLogs = [...logs];
                newLogs[existingLogIndex] = { ...newLogs[existingLogIndex], value };
                setLogs(newLogs);
            }
        } else {
            // Only add if value > 0
            if (value > 0) {
                const newLog: HabitLog = {
                    id: generateId(),
                    habitId,
                    date,
                    value,
                    timestamp: Date.now(),
                };
                setLogs([...logs, newLog]);
            }
        }
    };

    const getHabitStats = (habitId: string): HabitStats => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) {
            return { currentStreak: 0, longestStreak: 0, totalCompletions: 0, complianceRate: 0, lastCompletedDate: null };
        }

        const habitLogs = logs.filter(l => l.habitId === habitId);
        const streak = calculateStreak(habit, habitLogs);

        return {
            currentStreak: streak,
            longestStreak: streak, // TODO: calculate historical max?
            totalCompletions: habitLogs.length, // Rough count
            complianceRate: 0, // TODO
            lastCompletedDate: habitLogs.length > 0 ? habitLogs.sort((a, b) => b.timestamp - a.timestamp)[0].date : null
        };
    };

    return (
        <HabitContext.Provider value={{ habits, logs, addHabit, updateHabit, deleteHabit, toggleHabitCompletion, getHabitStats, renameCategory }}>
            {children}
        </HabitContext.Provider>
    );
};

export const useHabits = () => {
    const context = useContext(HabitContext);
    if (context === undefined) {
        throw new Error('useHabits must be used within a HabitProvider');
    }
    return context;
};
