import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Habit, HabitLog, HabitStats } from '../types';
import { calculateStreak } from '../utils/streakUtils';
import { api } from '../api/client';

interface HabitContextType {
    habits: Habit[];
    logs: HabitLog[];
    isLoading: boolean;
    error: string | null;
    addHabit: (habit: Omit<Habit, 'id' | 'archived'>) => Promise<void>;
    updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
    deleteHabit: (id: string) => Promise<void>;
    renameCategory: (oldCategory: string, newCategory: string) => Promise<void>;
    reorderHabits: (orderedIds: string[]) => Promise<void>;
    toggleHabitCompletion: (habitId: string, date: string, value?: number) => Promise<void>;
    getHabitStats: (habitId: string) => HabitStats;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<HabitLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Initial Fetch
    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                const [habitsData, logsData] = await Promise.all([
                    api.habits.list(),
                    api.logs.list()
                ]);
                setHabits(habitsData);
                setLogs(logsData);
            } catch (err) {
                console.error(err);
                setError('Failed to load habits data');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const addHabit = async (habitData: Omit<Habit, 'id' | 'archived'>) => {
        try {
            const newHabit = await api.habits.create(habitData);
            setHabits(prev => [...prev, newHabit]);
        } catch (err) {
            console.error(err);
            setError('Failed to create habit');
        }
    };

    const updateHabit = async (id: string, updates: Partial<Habit>) => {
        try {
            const updated = await api.habits.update(id, updates);
            setHabits(prev => prev.map(h => h.id === id ? updated : h));
        } catch (err) {
            console.error(err);
            setError('Failed to update habit');
        }
    };

    const deleteHabit = async (id: string) => {
        try {
            await api.habits.delete(id);
            setHabits(prev => prev.filter(h => h.id !== id));
            setLogs(prev => prev.filter(l => l.habitId !== id));
        } catch (err) {
            console.error(err);
            setError('Failed to delete habit');
        }
    };

    const renameCategory = async (oldCategory: string, newCategory: string) => {
        try {
            // Optimistic update
            setHabits(prev => prev.map(h =>
                h.category === oldCategory ? { ...h, category: newCategory } : h
            ));

            // In backend we would probably need a bulk update endpoint, 
            // but for now we iterate (not efficient but functionally correct for MVP)
            const habitsToUpdate = habits.filter(h => h.category === oldCategory);
            await Promise.all(habitsToUpdate.map(h => api.habits.update(h.id, { category: newCategory })));
        } catch (err) {
            console.error(err);
            setError('Failed to rename category');
            // Revert on error? Skipping for now
        }
    };

    const reorderHabits = async (orderedIds: string[]) => {
        const orderById = new Map(orderedIds.map((id, index) => [id, index]));

        // Optimistic update
        setHabits(prev => prev.map(h =>
            orderById.has(h.id) ? { ...h, order: orderById.get(h.id)! } : h
        ));

        try {
            await Promise.all(
                orderedIds.map((id, index) => api.habits.update(id, { order: index }))
            );
        } catch (err) {
            console.error(err);
            setError('Failed to reorder habits');
        }
    };

    const toggleHabitCompletion = async (habitId: string, date: string, value: number = 1) => {
        // Optimistic UI update could be added here for speed, 
        // but for safety we'll wait for server.
        try {
            const result = await api.logs.toggle(habitId, date, value);

            if (result.deleted) {
                setLogs(prev => prev.filter(l => !(l.habitId === habitId && l.date === date)));
            } else if (result.id) {
                // Check if it was an update or insert
                setLogs(prev => {
                    const exists = prev.some(l => l.habitId === habitId && l.date === date);
                    if (exists) {
                        return prev.map(l => (l.habitId === habitId && l.date === date) ? result : l);
                    } else {
                        return [...prev, result];
                    }
                });
            }
        } catch (err) {
            console.error(err);
            setError('Failed to toggle completion');
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
            longestStreak: streak, // TODO: calculate historical max
            totalCompletions: habitLogs.length,
            complianceRate: 0,
            lastCompletedDate: habitLogs.length > 0 ? habitLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].date : null
        };
    };

    return (
        <HabitContext.Provider value={{ habits, logs, isLoading, error, addHabit, updateHabit, deleteHabit, toggleHabitCompletion, getHabitStats, renameCategory, reorderHabits }}>
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
