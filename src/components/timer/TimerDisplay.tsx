import React from 'react';
import { TimerMode } from '../../types/timer';
import { Play, Pause, RotateCcw, Settings, SkipForward } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TimerDisplayProps {
    timeLeft: number;
    duration: number;
    mode: TimerMode;
    isActive: boolean;
    onToggle: () => void;
    onReset: () => void;
    onSkip: () => void;
    onSettingsClick: () => void;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
    timeLeft,
    duration,
    mode,
    isActive,
    onToggle,
    onReset,
    onSkip,
    onSettingsClick
}) => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

    const getModeColor = () => {
        switch (mode) {
            case 'focus': return 'text-indigo-600 dark:text-indigo-400';
            case 'shortBreak': return 'text-teal-600 dark:text-teal-400';
            case 'longBreak': return 'text-blue-600 dark:text-blue-400';
            default: return 'text-slate-800';
        }
    };

    const getModeLabel = () => {
        switch (mode) {
            case 'focus': return 'Tiempo de Foco';
            case 'shortBreak': return 'Descanso Corto';
            case 'longBreak': return 'Descanso Largo';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 w-full max-w-xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between w-full mb-8">
                <div className={cn("flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold bg-slate-100 dark:bg-slate-700/50", getModeColor())}>
                    <div className={cn("w-2 h-2 rounded-full bg-current")} />
                    {getModeLabel()}
                </div>
                <button
                    onClick={onSettingsClick}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <Settings size={20} />
                </button>
            </div>

            {/* Timer Circle */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                {/* Background Circle */}
                <svg className="absolute w-full h-full transform -rotate-90">
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-100 dark:text-slate-700"
                    />
                    {/* Progress Circle */}
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)} // Inverted logic for filling up? Or depleting. Usually depletes.
                        // If we want it to deplete: offset starts at 0 and goes to max.
                        // If we want it to fill: offset starts at max and goes to 0.
                        // Let's make it deplete (it's a timer).
                        // At start (progress 0), offset should be 0 (full ring).
                        // At end (progress 100), offset should be 2*PI*r (empty ring).
                        // Wait, progress calculated above is (duration - timeLeft) / duration.
                        // So progress goes 0 -> 100.
                        // If I want to show "Time Left", the bar should shrink.
                        // So I should use `timeLeft / duration` instead.
                        className={cn("transition-all duration-1000 ease-linear", getModeColor())}
                        style={{
                            strokeDashoffset: 2 * Math.PI * 120 * (progress / 100)
                        }}
                        strokeLinecap="round"
                    />
                </svg>

                {/* Time Display */}
                <div className="text-center z-10">
                    <div className={cn("text-6xl font-black tabular-nums tracking-tight", getModeColor())}>
                        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggle}
                    className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 active:scale-95",
                        isActive ? "bg-amber-500 shadow-amber-500/30" : "bg-indigo-600 shadow-indigo-500/30"
                    )}
                >
                    {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>

                <button
                    onClick={onReset}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    <RotateCcw size={20} />
                </button>

                <button
                    onClick={onSkip}
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                    <SkipForward size={20} />
                </button>
            </div>
        </div>
    );
};

export default TimerDisplay;
