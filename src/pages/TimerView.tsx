import React, { useState, useEffect } from 'react';
import TimerDisplay from '../components/timer/TimerDisplay';
import TaskSection from '../components/timer/TaskSection';
import TimerSettings from '../components/timer/TimerSettings';
import { Task } from '../types/timer';
import { useTimer } from '../context/TimerContext';
import { api } from '../api/client';

const TimerView: React.FC = () => {
    // Tasks State (Now fetched from API)
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        const loadTasks = async () => {
            try {
                setIsLoading(true);
                const data = await api.tasks.list();
                setTasks(data);
            } catch (err) {
                console.error('Failed to load tasks', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadTasks();
    }, []);

    // Consume Timer Context
    const {
        config,
        updateConfig,
        mode,
        timeLeft,
        isActive,
        pomodorosCompleted,
        toggleTimer,
        resetTimer,
        skip,
        setMode
    } = useTimer();

    const [showSettings, setShowSettings] = useState(false);

    // Initial permission check
    useEffect(() => {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, []);

    // Task Handlers
    const handleAddTask = async (taskInput: Omit<Task, 'id' | 'createdAt' | 'status' | 'completedPomodoros'>) => {
        try {
            const newTask = await api.tasks.create(taskInput);
            setTasks(prev => [newTask, ...prev]);
        } catch (err) {
            console.error('Failed to add task', err);
        }
    };

    const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
        try {
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
            await api.tasks.update(id, updates);
        } catch (err) {
            console.error('Failed to update task', err);
            // Could revert here
        }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            // Optimistic update
            setTasks(prev => prev.filter(t => t.id !== id));
            await api.tasks.delete(id);
        } catch (err) {
            console.error('Failed to delete task', err);
        }
    };

    return (
        <div className="h-full overflow-y-auto pb-20 p-4 md:p-8">
            <div className="max-w-xl mx-auto space-y-8">
                <div>
                    <TimerDisplay
                        timeLeft={timeLeft}
                        duration={
                            (mode === 'focus' ? config.focusDuration :
                                mode === 'shortBreak' ? config.shortBreakDuration :
                                    config.longBreakDuration) * 60
                        }
                        mode={mode}
                        isActive={isActive}
                        onToggle={toggleTimer}
                        onReset={resetTimer}
                        onSkip={skip}
                        onSettingsClick={() => setShowSettings(true)}
                    />

                    <div className="mt-8 text-center text-slate-500 text-sm">
                        <p>Pomodoros Diarios: <span className="font-bold text-slate-800 dark:text-white text-lg">{pomodorosCompleted}</span></p>
                    </div>
                </div>

                <div>
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <TaskSection
                            tasks={tasks}
                            onAddTask={handleAddTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                        />
                    )}
                </div>
            </div>

            <TimerSettings
                config={config}
                onUpdateConfig={updateConfig}
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </div>
    );
};

export default TimerView;
