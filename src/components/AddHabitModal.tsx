import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Frequency, MetricType } from '../types';
import { X, Check } from 'lucide-react';
import { cn } from '../utils/cn';

import { Habit } from '../types';

interface AddHabitModalProps {
    onClose: () => void;
    initialHabit?: Habit;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ onClose, initialHabit }) => {
    const { addHabit, updateHabit } = useHabits();

    const [name, setName] = useState(initialHabit?.name || '');
    const [frequency, setFrequency] = useState<Frequency>(initialHabit?.frequency || 'daily');
    const [metricType, setMetricType] = useState<MetricType>(initialHabit?.metricType || 'boolean');

    // Conditionally shown fields
    const [goal, setGoal] = useState<number>(initialHabit?.goal || 1);
    const [targetValue, setTargetValue] = useState<number>(initialHabit?.targetValue || 1);
    const [unit, setUnit] = useState(initialHabit?.unit || '');
    const [category, setCategory] = useState(initialHabit?.category || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const habitData = {
            name,
            frequency,
            metricType,
            goal: frequency === 'daily' ? 1 : goal,
            targetValue: metricType === 'boolean' ? 1 : targetValue,
            unit: metricType === 'boolean' ? undefined : unit,
            category: category.trim() || undefined,
            // Keep original start date if editing, else new
            startDate: initialHabit?.startDate || new Date().toISOString()
        };

        if (initialHabit) {
            updateHabit(initialHabit.id, habitData);
        } else {
            addHabit(habitData);
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">{initialHabit ? 'Edit Habit' : 'New Habit'}</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">What do you want to achieve?</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Read books, Run 5km..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-lg"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Area / Category</label>
                        <input
                            type="text"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            placeholder="e.g. Health, Mind, Work..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                            list="category-suggestions"
                        />
                        <datalist id="category-suggestions">
                            <option value="Health" />
                            <option value="Mind" />
                            <option value="Work" />
                            <option value="Spirit" />
                        </datalist>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* Frequency */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">How often?</label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as Frequency)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        {/* Metric Type */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">How to track?</label>
                            <select
                                value={metricType}
                                onChange={(e) => setMetricType(e.target.value as MetricType)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all appearance-none"
                            >
                                <option value="boolean">Yes / No</option>
                                <option value="numeric">Number (Count)</option>
                            </select>
                        </div>
                    </div>

                    {/* Conditional Fields */}
                    {(frequency !== 'daily' || metricType === 'numeric') && (
                        <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                            {frequency !== 'daily' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
                                        Times per {frequency === 'weekly' ? 'week' : 'month'}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            value={goal}
                                            onChange={e => setGoal(parseInt(e.target.value) || 1)}
                                            className="w-20 px-3 py-2 rounded-lg border border-slate-200"
                                        />
                                        <span className="text-slate-500 text-sm">times</span>
                                    </div>
                                </div>
                            )}

                            {metricType === 'numeric' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-2">Target per day/entry</label>
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                min="1"
                                                value={targetValue}
                                                onChange={e => setTargetValue(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200"
                                                placeholder="Value"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={unit}
                                                onChange={e => setUnit(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200"
                                                placeholder="Unit (e.g. pages)"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className={cn(
                            "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all",
                            name.trim()
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.02]"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        <Check size={20} />
                        {initialHabit ? 'Save Changes' : 'Create Habit'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddHabitModal;
