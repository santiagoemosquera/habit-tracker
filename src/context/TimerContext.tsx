import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { TimerConfig, TimerMode } from '../types/timer';
import { playNotificationSound } from '../utils/sound';

interface TimerContextProps {
    config: TimerConfig;
    updateConfig: (newConfig: TimerConfig) => void;
    mode: TimerMode;
    timeLeft: number;
    isActive: boolean;
    pomodorosCompleted: number;
    toggleTimer: () => void;
    resetTimer: () => void;
    skip: () => void;
    setMode: (mode: TimerMode) => void;
}

const TimerContext = createContext<TimerContextProps | undefined>(undefined);

const DEFAULT_CONFIG: TimerConfig = {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false
};

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Persistent State: Config
    const [config, setConfig] = useState<TimerConfig>(() => {
        const saved = localStorage.getItem('timer_config');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });

    useEffect(() => {
        localStorage.setItem('timer_config', JSON.stringify(config));
    }, [config]);

    // Timer State
    const [mode, setMode] = useState<TimerMode>('focus');
    const [timeLeft, setTimeLeft] = useState(config.focusDuration * 60);
    const [isActive, setIsActive] = useState(false);
    const [pomodorosCompleted, setPomodorosCompleted] = useState(0);

    const timerRef = useRef<number | null>(null);

    const getDurationForMode = (m: TimerMode) => {
        switch (m) {
            case 'focus': return config.focusDuration;
            case 'shortBreak': return config.shortBreakDuration;
            case 'longBreak': return config.longBreakDuration;
        }
    };

    // Initial load time update when config changes (only if not active)
    useEffect(() => {
        if (!isActive) {
            setTimeLeft(getDurationForMode(mode) * 60);
        }
    }, [config, mode]);

    const handleTimerComplete = () => {
        playNotificationSound();
        // Browser Notification
        if (Notification.permission === 'granted') {
            new Notification("¡Timer Finalizado!", {
                body: `${mode === 'focus' ? 'El tiempo de foco ha terminado' : 'El descanso ha terminado'}.`
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        if (mode === 'focus') {
            const newCompleted = pomodorosCompleted + 1;
            setPomodorosCompleted(newCompleted);

            // Decide next mode
            const isLongBreak = newCompleted % config.longBreakInterval === 0;
            const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';

            setMode(nextMode);
            setTimeLeft(getDurationForMode(nextMode) * 60);
            setIsActive(config.autoStartBreaks);

        } else {
            // Break is over, back to focus
            setMode('focus');
            setTimeLeft(config.focusDuration * 60);
            setIsActive(config.autoStartPomodoros);
        }
    };

    useEffect(() => {
        let interval: number;
        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, config]); // mode and config dependencies are needed for handleTimerComplete closure capture if not careful, but simplified here.

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(getDurationForMode(mode) * 60);
    };

    const skip = () => {
        setIsActive(false);
        handleTimerComplete();
    };

    const updateConfig = (newConfig: TimerConfig) => {
        setConfig(newConfig);
    };

    return (
        <TimerContext.Provider value={{
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
        }}>
            {children}
        </TimerContext.Provider>
    );
};

export const useTimer = () => {
    const context = useContext(TimerContext);
    if (context === undefined) {
        throw new Error('useTimer must be used within a TimerProvider');
    }
    return context;
};
