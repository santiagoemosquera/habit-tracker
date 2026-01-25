import React from 'react';
import { TimerConfig } from '../../types/timer';
import { Settings, X } from 'lucide-react';

interface TimerSettingsProps {
    config: TimerConfig;
    onUpdateConfig: (newConfig: TimerConfig) => void;
    isOpen: boolean;
    onClose: () => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ config, onUpdateConfig, isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleChange = (key: keyof TimerConfig, value: number | boolean) => {
        onUpdateConfig({ ...config, [key]: value });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Settings size={20} />
                        Configuración
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-slate-600 dark:text-slate-300 font-medium">Duración del Pomodoro</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={config.focusDuration}
                                onChange={(e) => handleChange('focusDuration', parseInt(e.target.value) || 25)}
                                className="w-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                min={1}
                            />
                            <span className="text-sm text-slate-400">min</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-slate-600 dark:text-slate-300 font-medium">Descanso Corto</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={config.shortBreakDuration}
                                onChange={(e) => handleChange('shortBreakDuration', parseInt(e.target.value) || 5)}
                                className="w-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                min={1}
                            />
                            <span className="text-sm text-slate-400">min</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-slate-600 dark:text-slate-300 font-medium">Descanso Largo</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={config.longBreakDuration}
                                onChange={(e) => handleChange('longBreakDuration', parseInt(e.target.value) || 15)}
                                className="w-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                min={1}
                            />
                            <span className="text-sm text-slate-400">min</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-slate-600 dark:text-slate-300 font-medium">Intervalo Desc. Largo</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={config.longBreakInterval}
                                onChange={(e) => handleChange('longBreakInterval', parseInt(e.target.value) || 4)}
                                className="w-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                min={1}
                            />
                            <span className="text-sm text-slate-400">pomodoros</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
                        <div className="flex items-center justify-between">
                            <label className="text-slate-600 dark:text-slate-300 font-medium cursor-pointer" htmlFor="autoStartBreaks">Autoiniciar Descansos</label>
                            <input
                                id="autoStartBreaks"
                                type="checkbox"
                                checked={config.autoStartBreaks}
                                onChange={(e) => handleChange('autoStartBreaks', e.target.checked)}
                                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between mt-3">
                            <label className="text-slate-600 dark:text-slate-300 font-medium cursor-pointer" htmlFor="autoStartPomodoros">Autoiniciar Pomodoros</label>
                            <input
                                id="autoStartPomodoros"
                                type="checkbox"
                                checked={config.autoStartPomodoros}
                                onChange={(e) => handleChange('autoStartPomodoros', e.target.checked)}
                                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimerSettings;
