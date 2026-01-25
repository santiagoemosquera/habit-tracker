import React, { useState, useEffect } from 'react';
import { Task } from '../../types/timer';
import { Flag, Calendar, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TaskFormProps {
    initialData?: Partial<Task>;
    onSubmit: (data: { title: string; estimatedPomodoros: number; priority: Task['priority']; deadline?: string }) => void;
    onCancel: () => void;
    submitLabel?: string;
}

const TaskForm: React.FC<TaskFormProps> = ({ initialData, onSubmit, onCancel, submitLabel = 'Guardar' }) => {
    const [title, setTitle] = useState(initialData?.title || '');
    const [estPomodoros, setEstPomodoros] = useState(initialData?.estimatedPomodoros || 1);
    const [priority, setPriority] = useState<Task['priority']>(initialData?.priority || 'none');
    const [deadline, setDeadline] = useState(initialData?.deadline || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSubmit({
            title,
            estimatedPomodoros: estPomodoros,
            priority,
            deadline: deadline || undefined,
        });
    };

    const priorityColor = (p: Task['priority']) => {
        switch (p) {
            case 'high': return 'text-red-500 fill-red-500/10';
            case 'medium': return 'text-amber-500 fill-amber-500/10';
            case 'low': return 'text-green-500 fill-green-500/10';
            default: return 'text-slate-400';
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <input
                type="text"
                placeholder="¿En qué estás trabajando?"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent text-lg font-medium placeholder-slate-400 text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-600 focus:border-indigo-500 outline-none pb-2 mb-4"
                autoFocus
            />

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-500">Pomodoros</span>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={estPomodoros}
                        onChange={e => setEstPomodoros(parseInt(e.target.value) || 1)}
                        className="w-12 text-center font-bold bg-transparent outline-none dark:text-slate-200"
                    />
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-1 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    {(['none', 'low', 'medium', 'high'] as const).map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={cn(
                                "p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                                priority === p ? "bg-slate-100 dark:bg-slate-700" : ""
                            )}
                            title={`Prioridad: ${p}`}
                        >
                            <Flag size={16} className={priorityColor(p)} fill={priority === p ? "currentColor" : "none"} />
                        </button>
                    ))}
                </div>

                <input
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                    className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 outline-none"
                />

                <div className="flex-1 text-right">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-slate-400 hover:text-slate-600 mr-2 text-sm font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!title.trim()}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitLabel}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default TaskForm;
