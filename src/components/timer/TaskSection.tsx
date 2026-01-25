import React, { useState } from 'react';
import { Task } from '../../types/timer';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Flag, Clock, ListFilter, ArrowUp, ArrowDown, X, Edit2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';
import { SortOption, SortField, sortTasks } from '../../utils/sortUtils';
import { Reorder } from 'framer-motion';
import TaskForm from './TaskForm';
import { useLocalStorage } from '../../hooks/useLocalStorage';

interface TaskSectionProps {
    tasks: Task[];
    onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'completedPomodoros'>) => void;
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
    onDeleteTask: (id: string) => void;
}

const TaskSection: React.FC<TaskSectionProps> = ({ tasks, onAddTask, onUpdateTask, onDeleteTask }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    // Sort State
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [sortCriteria, setSortCriteria] = useLocalStorage<SortOption[]>('timer-task-sort-criteria', [
        { id: 'default', field: 'created', direction: 'desc' }
    ]);

    const priorityColor = (p: Task['priority']) => {
        switch (p) {
            case 'high': return 'text-red-500 fill-red-500/10';
            case 'medium': return 'text-amber-500 fill-amber-500/10';
            case 'low': return 'text-green-500 fill-green-500/10';
            default: return 'text-slate-400';
        }
    };

    const getFieldLabel = (field: SortField) => {
        switch (field) {
            case 'created': return 'Creación';
            case 'deadline': return 'Fecha Límite';
            case 'priority': return 'Prioridad';
            case 'effort': return 'Esfuerzo';
            default: return field;
        }
    };

    // Sort Handlers
    const addSortCriterion = (field: SortField) => {
        if (sortCriteria.some(c => c.field === field)) return;

        let newCriteria = sortCriteria.filter(c => c.field !== 'created');

        newCriteria.push({
            id: crypto.randomUUID(),
            field,
            direction: field === 'deadline' || field === 'effort' || field === 'created' ? 'asc' : 'desc'
        });
        setSortCriteria(newCriteria);
    };

    const removeSortCriterion = (id: string) => {
        const newCriteria = sortCriteria.filter(c => c.id !== id);
        if (newCriteria.length === 0) {
            setSortCriteria([{ id: 'default', field: 'created', direction: 'desc' }]);
        } else {
            setSortCriteria(newCriteria);
        }
    };

    const toggleSortDirection = (id: string) => {
        setSortCriteria(prev => prev.map(c =>
            c.id === id ? { ...c, direction: c.direction === 'asc' ? 'desc' : 'asc' } : c
        ));
    };

    // Derived State
    const activeTasksUnsorted = tasks.filter(t => t.status === 'pending');
    const activeTasks = sortTasks(activeTasksUnsorted, sortCriteria);
    const completedTasks = tasks.filter(t => t.status === 'completed');

    const handleCreateTask = (data: { title: string; estimatedPomodoros: number; priority: Task['priority']; deadline?: string }) => {
        onAddTask(data);
        setShowAddForm(false);
    };

    const handleEditTask = (id: string, data: { title: string; estimatedPomodoros: number; priority: Task['priority']; deadline?: string }) => {
        onUpdateTask(id, data);
        setEditingTaskId(null);
    };

    return (
        <div className="w-full max-w-xl mx-auto mt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Tareas
                    <span className="text-sm font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {activeTasks.length}
                    </span>
                </h3>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className={cn(
                            "flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors",
                            showSortMenu || sortCriteria[0].field !== 'created'
                                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                                : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                    >
                        <ListFilter size={16} />
                        Ordenar
                        {sortCriteria.length > 0 && sortCriteria[0].field !== 'created' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5" />
                        )}
                    </button>

                    <button
                        onClick={() => {
                            setShowAddForm(!showAddForm);
                            setEditingTaskId(null); // Close edit if opening add
                        }}
                        className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Nueva
                    </button>
                </div>
            </div>

            {/* Sort Menu */}
            {showSortMenu && (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 animate-in slide-in-from-top-2 shadow-lg z-10 relative">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Criterios de Orden</h4>
                            {sortCriteria[0].field !== 'created' && (
                                <button
                                    onClick={() => setSortCriteria([{ id: 'default', field: 'created', direction: 'desc' }])}
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    Resetear
                                </button>
                            )}
                        </div>




                        <div className="space-y-2">
                            <Reorder.Group axis="y" values={sortCriteria} onReorder={setSortCriteria} className="space-y-2">
                                {sortCriteria.map((criteria, index) => (
                                    <Reorder.Item
                                        key={criteria.id}
                                        value={criteria}
                                        className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700 cursor-grab active:cursor-grabbing"
                                    >
                                        <span className="text-xs font-bold text-slate-400 w-4">{index + 1}.</span>
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize flex-1 select-none">
                                            {getFieldLabel(criteria.field)}
                                        </span>

                                        <button
                                            onClick={() => toggleSortDirection(criteria.id)}
                                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-500"
                                            title={criteria.direction === 'asc' ? "Ascendente" : "Descendente"}
                                            onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on button click
                                        >
                                            {criteria.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        </button>

                                        {criteria.field !== 'created' && (
                                            <button
                                                onClick={() => removeSortCriterion(criteria.id)}
                                                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 hover:text-red-500 transition-colors"
                                                onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                            <span className="text-xs font-medium text-slate-500 mb-2 block">Agregar criterio:</span>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => addSortCriterion('deadline')}
                                    disabled={sortCriteria.some(c => c.field === 'deadline')}
                                    className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:border-indigo-400"
                                >
                                    + Fecha Límite
                                </button>
                                <button
                                    onClick={() => addSortCriterion('priority')}
                                    disabled={sortCriteria.some(c => c.field === 'priority')}
                                    className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:border-indigo-400"
                                >
                                    + Prioridad
                                </button>
                                <button
                                    onClick={() => addSortCriterion('effort')}
                                    disabled={sortCriteria.some(c => c.field === 'effort')}
                                    className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs font-medium text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:border-indigo-400"
                                >
                                    + Esfuerzo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Task Form */}
            {showAddForm && (
                <div className="mb-6 animate-in slide-in-from-top-2">
                    <TaskForm
                        onSubmit={handleCreateTask}
                        onCancel={() => setShowAddForm(false)}
                        submitLabel="Crear Tarea"
                    />
                </div>
            )}

            {/* Task List */}
            <div className="space-y-3">
                {activeTasks.map(task => {
                    const isEditing = editingTaskId === task.id;

                    if (isEditing) {
                        return (
                            <div key={task.id} className="animate-in fade-in zoom-in-95">
                                <TaskForm
                                    initialData={task}
                                    onSubmit={(data) => handleEditTask(task.id, data)}
                                    onCancel={() => setEditingTaskId(null)}
                                    submitLabel="Actualizar"
                                />
                            </div>
                        );
                    }

                    return (
                        <div key={task.id} className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm hover:shadow-md">
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => onUpdateTask(task.id, { status: 'completed' })}
                                    className="mt-1 text-slate-300 hover:text-green-500 transition-colors"
                                >
                                    <Circle size={22} strokeWidth={2} />
                                </button>

                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-medium text-slate-800 dark:text-slate-100 text-lg leading-tight">{task.title}</h4>
                                        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => setEditingTaskId(task.id)}
                                                className="p-1.5 text-slate-300 hover:text-indigo-500 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteTask(task.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded text-xs font-bold">
                                            <Clock size={12} />
                                            {task.completedPomodoros} / {task.estimatedPomodoros}
                                        </span>

                                        {task.priority !== 'none' && (
                                            <span className="flex items-center gap-1">
                                                <Flag size={14} className={priorityColor(task.priority)} fill="currentColor" />
                                            </span>
                                        )}

                                        {task.deadline && (
                                            <span className="flex items-center gap-1 text-xs">
                                                <Calendar size={12} />
                                                {format(new Date(task.deadline + 'T12:00:00'), 'MMM d')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Completed */}
            {completedTasks.length > 0 && (
                <div className="mt-6">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Completadas</h4>
                    <div className="space-y-2 opacity-60">
                        {completedTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-transparent">
                                <button
                                    onClick={() => onUpdateTask(task.id, { status: 'pending' })}
                                    className="text-green-500"
                                >
                                    <CheckCircle2 size={20} />
                                </button>
                                <span className="line-through text-slate-500">{task.title}</span>
                                <button
                                    onClick={() => onDeleteTask(task.id)}
                                    className="ml-auto text-slate-300 hover:text-red-500 p-1"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskSection;
