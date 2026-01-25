import React, { useState, useEffect } from 'react';
import TimerDisplay from '../components/timer/TimerDisplay';
import TaskSection from '../components/timer/TaskSection';
import TimerSettings from '../components/timer/TimerSettings';
import { Task } from '../types/timer';
import { useTimer } from '../context/TimerContext';

const TimerView: React.FC = () => {
    // Persistent State: Tasks (Still local for now, could be moved to context if needed globally)
    const [tasks, setTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem('timer_tasks');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('timer_tasks', JSON.stringify(tasks));
    }, [tasks]);

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
        setMode // Exposed just in case, but usually handled internally/via skip
    } = useTimer();

    const [showSettings, setShowSettings] = useState(false);

    // Initial permission check (could be in context too but fine here)
    useEffect(() => {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, []);

    // Task Handlers
    const handleAddTask = (taskInput: Omit<Task, 'id' | 'createdAt' | 'status' | 'completedPomodoros'>) => {
        const newTask: Task = {
            ...taskInput,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            status: 'pending',
            completedPomodoros: 0
        };
        setTasks(prev => [newTask, ...prev]);
    };

    const handleUpdateTask = (id: string, updates: Partial<Task>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleDeleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    return (
        <div className="h-full overflow-y-auto pb-20 p-4 md:p-8">
            <div className="max-w-xl mx-auto space-y-8">
                <div>
                    <TimerDisplay
                        timeLeft={timeLeft}
                        duration={
                            // Duration calculation logic duplicated here for display helper? 
                            // Or better to export getDurationForMode from context?
                            // Simple fix: calculate locally based on config and mode
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
                    <TaskSection
                        tasks={tasks}
                        onAddTask={handleAddTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                    />
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
