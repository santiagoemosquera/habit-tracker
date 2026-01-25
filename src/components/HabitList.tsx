import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import HabitCard from './HabitCard';
import { Edit2, Check, X } from 'lucide-react';

const HabitList: React.FC = () => {
    const { habits, renameCategory } = useHabits();
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const activeHabits = habits.filter(h => !h.archived);

    // Grouping
    const groupedHabits = activeHabits.reduce((acc, habit) => {
        const category = habit.category || 'Other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(habit);
        return acc;
    }, {} as Record<string, typeof activeHabits>);

    // Order categories nicely if we can, or just alphabetical
    const categories = Object.keys(groupedHabits).sort((a, b) => {
        if (a === 'Other') return 1;
        if (b === 'Other') return -1;
        return a.localeCompare(b);
    });

    const startEditing = (category: string) => {
        setEditingCategory(category);
        setEditValue(category);
    };

    const saveCategory = (oldCategory: string) => {
        if (editValue.trim() && editValue !== oldCategory) {
            renameCategory(oldCategory, editValue.trim());
        }
        setEditingCategory(null);
    };

    return (
        <div className="space-y-8">
            {categories.map(category => (
                <div key={category}>
                    <div className="flex items-center gap-2 mb-4 px-1 group">
                        {editingCategory === category ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-indigo-500 outline-none w-48"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveCategory(category);
                                        if (e.key === 'Escape') setEditingCategory(null);
                                    }}
                                />
                                <button
                                    onClick={() => saveCategory(category)}
                                    className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                                >
                                    <Check size={18} />
                                </button>
                                <button
                                    onClick={() => setEditingCategory(null)}
                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    {category}
                                    <span className="text-xs font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                        {groupedHabits[category].length}
                                    </span>
                                </h3>

                                <button
                                    onClick={() => startEditing(category)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-indigo-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                    title="Renombrar categoría"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groupedHabits[category].map(habit => (
                            <HabitCard key={habit.id} habit={habit} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HabitList;
