import React, { useState } from 'react';
import { useHabits } from '../context/HabitContext';
import { Frequency, MetricType } from '../types';
import { X, Check, Swords, Skull, SlidersHorizontal } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Attribute, HabitKind } from '../types/game';
import { ATTRIBUTES, ATTRIBUTE_KEYS, BAD_PRESETS, GOOD_PRESETS, attributeForCategory, resolveHabitValues } from '../game/rules';

import { Habit } from '../types';

interface AddHabitModalProps {
    onClose: () => void;
    initialHabit?: Habit;
    initialKind?: HabitKind;
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ onClose, initialHabit, initialKind }) => {
    const { addHabit, updateHabit } = useHabits();

    const [name, setName] = useState(initialHabit?.name || '');
    const [frequency, setFrequency] = useState<Frequency>(initialHabit?.frequency || 'daily');
    const [metricType, setMetricType] = useState<MetricType>(initialHabit?.metricType || 'boolean');

    // Conditionally shown fields
    const [goal, setGoal] = useState<number>(initialHabit?.goal || 1);
    const [targetValue, setTargetValue] = useState<number>(initialHabit?.targetValue || 1);
    const [unit, setUnit] = useState(initialHabit?.unit || '');
    const [category, setCategory] = useState(initialHabit?.category || '');

    // Game settings
    const [kind, setKind] = useState<HabitKind>(initialHabit?.kind || initialKind || 'good');
    const [difficulty, setDifficulty] = useState<string>(
        initialHabit?.difficulty || ((initialHabit?.kind || initialKind) === 'bad' ? 'medium' : 'easy')
    );
    const [attribute, setAttribute] = useState<Attribute | null>(initialHabit?.attribute ?? null);
    const [customize, setCustomize] = useState(
        initialHabit?.customXp != null || initialHabit?.customGold != null || initialHabit?.customHp != null
    );
    const [customXp, setCustomXp] = useState(initialHabit?.customXp?.toString() ?? '');
    const [customGold, setCustomGold] = useState(initialHabit?.customGold?.toString() ?? '');
    const [customHp, setCustomHp] = useState(initialHabit?.customHp?.toString() ?? '');

    const isBad = kind === 'bad';
    const presets: Record<string, { label: string; xp?: number; gold: number; hp: number; hint: string }> =
        isBad ? BAD_PRESETS : GOOD_PRESETS;

    const changeKind = (next: HabitKind) => {
        setKind(next);
        // Keep difficulty valid for the selected kind
        setDifficulty(next === 'bad' ? 'medium' : 'easy');
    };

    const parseCustom = (v: string) => {
        if (!customize || v.trim() === '') return null;
        const n = parseInt(v);
        return isNaN(n) || n < 0 ? null : n;
    };

    const preview = resolveHabitValues({
        id: '', name, category, kind, difficulty, attribute, frequency, metricType, targetValue, goal,
        customXp: isBad ? null : parseCustom(customXp), customGold: parseCustom(customGold), customHp: parseCustom(customHp),
    });
    const presetValues = presets[difficulty];
    const autoAttribute = ATTRIBUTES[attributeForCategory(category)];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const habitData = {
            name,
            // Bad habits count relapses per day
            frequency: isBad ? 'daily' as Frequency : frequency,
            metricType: isBad ? 'numeric' as MetricType : metricType,
            goal: isBad || frequency === 'daily' ? 1 : goal,
            targetValue: isBad || metricType === 'boolean' ? 1 : targetValue,
            unit: isBad ? 'recaídas' : metricType === 'boolean' ? undefined : unit,
            kind,
            difficulty,
            attribute,
            customXp: isBad ? null : parseCustom(customXp),
            customGold: parseCustom(customGold),
            customHp: parseCustom(customHp),
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
            <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">
                        {initialHabit ? (isBad ? 'Editar mal hábito' : 'Edit Habit') : (isBad ? 'Nuevo mal hábito' : 'New Habit')}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Kind */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => changeKind('good')}
                            className={cn("flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all",
                                !isBad ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            <Swords size={16} /> Hábito bueno
                        </button>
                        <button
                            type="button"
                            onClick={() => changeKind('bad')}
                            className={cn("flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all",
                                isBad ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            <Skull size={16} /> Mal hábito
                        </button>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            {isBad ? '¿Qué querés dejar de hacer?' : 'What do you want to achieve?'}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={isBad ? 'ej. Comer chatarra, scrollear en la cama...' : 'e.g. Read books, Run 5km...'}
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

                    {!isBad && (<>
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
                    </>)}

                    {/* Difficulty / severity */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            {isBad ? 'Severidad' : 'Dificultad'}
                        </label>
                        <div className={cn("grid gap-2", isBad ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
                            {Object.entries(presets).map(([key, p]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setDifficulty(key)}
                                    title={p.hint}
                                    className={cn(
                                        "rounded-xl border px-2 py-2 text-left transition-all",
                                        difficulty === key
                                            ? (isBad ? "border-rose-400 bg-rose-50 ring-2 ring-rose-100" : "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100")
                                            : "border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    <span className="block text-sm font-bold text-slate-800">{p.label}</span>
                                    <span className="block text-[11px] text-slate-500">
                                        {isBad ? `−${p.gold} 🪙 −${p.hp} ❤️` : `+${p.xp} XP +${p.gold} 🪙`}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <p className="mt-1.5 text-xs text-slate-400">{presetValues?.hint}</p>
                    </div>

                    {/* Attribute (good habits only; bad-habit clean days always train Espíritu) */}
                    {!isBad && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Atributo que entrena</label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAttribute(null)}
                                    className={cn("px-3 py-1.5 rounded-full border text-xs font-bold transition-all",
                                        attribute === null ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500")}
                                >
                                    Auto ({autoAttribute.icon} {autoAttribute.label})
                                </button>
                                {ATTRIBUTE_KEYS.map(key => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setAttribute(key)}
                                        title={ATTRIBUTES[key].hint}
                                        className={cn("px-3 py-1.5 rounded-full border text-xs font-bold transition-all",
                                            attribute === key ? "border-indigo-400 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300")}
                                    >
                                        {ATTRIBUTES[key].icon} {ATTRIBUTES[key].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom values */}
                    <div className="rounded-xl border border-slate-200 p-4">
                        <button
                            type="button"
                            onClick={() => setCustomize(c => !c)}
                            className="w-full flex items-center justify-between text-sm font-bold text-slate-700"
                        >
                            <span className="flex items-center gap-2"><SlidersHorizontal size={16} /> Personalizar valores</span>
                            <span className={cn("w-9 h-5 rounded-full p-0.5 transition-colors", customize ? "bg-indigo-600" : "bg-slate-300")}>
                                <span className={cn("block w-4 h-4 rounded-full bg-white transition-transform", customize && "translate-x-4")} />
                            </span>
                        </button>
                        {customize && (
                            <div className={cn("grid gap-3 mt-4", isBad ? "grid-cols-2" : "grid-cols-3")}>
                                {!isBad && (
                                    <label className="text-xs font-medium text-slate-500">
                                        XP que gana
                                        <input type="number" min="0" value={customXp} onChange={e => setCustomXp(e.target.value)}
                                            placeholder={String(presetValues?.xp ?? '')}
                                            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800" />
                                    </label>
                                )}
                                <label className="text-xs font-medium text-slate-500">
                                    {isBad ? 'Oro que resta' : 'Oro que gana'}
                                    <input type="number" min="0" value={customGold} onChange={e => setCustomGold(e.target.value)}
                                        placeholder={String(presetValues?.gold ?? '')}
                                        className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800" />
                                </label>
                                <label className="text-xs font-medium text-slate-500">
                                    {isBad ? 'Vida que resta' : 'Daño si no la hacés'}
                                    <input type="number" min="0" value={customHp} onChange={e => setCustomHp(e.target.value)}
                                        placeholder={String(presetValues?.hp ?? '')}
                                        className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800" />
                                </label>
                            </div>
                        )}
                        <p className="mt-3 text-xs text-slate-500">
                            {isBad
                                ? <>Cada recaída: <b className="text-rose-600">−{preview.gold} 🪙 −{preview.hp} ❤️</b>. Cada día sin caer: +5 XP de Espíritu.</>
                                : <>Al completarlo: <b className="text-indigo-600">+{preview.xp} XP +{preview.gold} 🪙</b>
                                    {frequency === 'daily' && <> · Si no lo hacés: <b className="text-rose-600">−{preview.hp} ❤️</b></>}
                                    <span className="text-slate-400"> (antes del combo y del modo de dificultad)</span></>}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className={cn(
                            "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all",
                            name.trim()
                                ? (isBad
                                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30 hover:scale-[1.02]"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.02]")
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        <Check size={20} />
                        {initialHabit ? 'Save Changes' : isBad ? 'Crear mal hábito' : 'Create Habit'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddHabitModal;
