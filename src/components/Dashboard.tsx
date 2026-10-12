import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Plus, Flame, Skull } from 'lucide-react';
import HabitList from './HabitList';
import AddHabitModal from './AddHabitModal';
import { HabitStats } from '../types';

const Dashboard: React.FC = () => {
    const { habits } = useHabits();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBadModalOpen, setIsBadModalOpen] = useState(false);

    // Calculate global stats (simple version)
    const activeHabits = habits.filter(h => !h.archived).length;

    return (
        <div className="space-y-8">
            {/* Header / Summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Today</h2>
                    <p className="text-slate-500 mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg font-medium transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={20} />
                        New Habit
                    </button>
                    <button
                        onClick={() => setIsBadModalOpen(true)}
                        className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 px-4 py-2.5 rounded-lg font-medium transition-all active:scale-95"
                    >
                        <Skull size={18} />
                        Mal hábito
                    </button>
                </div>
            </div>



            {/* Main Content */}
            {habits.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 mb-4">
                        <Flame size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No habits yet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">Start your journey by adding your first habit. Small steps lead to big changes.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-6 text-indigo-600 font-medium hover:text-indigo-700 hover:underline"
                    >
                        Create one now
                    </button>
                </div>
            ) : (
                <HabitList />
            )}

            {/* Modal */}
            {isModalOpen && <AddHabitModal onClose={() => setIsModalOpen(false)} />}
            {isBadModalOpen && <AddHabitModal onClose={() => setIsBadModalOpen(false)} initialKind="bad" />}
        </div>
    );
};

export default Dashboard;
