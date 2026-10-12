import React, { useEffect, useState } from 'react';
import { differenceInCalendarDays } from 'date-fns';
import { Check, ChevronDown, Pencil, Plus, RotateCcw, Scroll, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { api } from '../api/client';
import { todayStr, useGame } from '../context/GameContext';
import {
    ATTRIBUTES, ATTRIBUTE_KEYS, QUEST_PRESETS, computeQuestReward, computeQuestStepXp, computeQuestOverduePenalty,
} from '../game/rules';
import type { Attribute, Quest, QuestSize } from '../types/game';
import { parseLocalDate } from '../utils/dateHelpers';
import { cn } from '../utils/cn';
import DeltaChips from '../components/game/DeltaChips';

// --- Form ---

interface QuestFormProps {
    initial?: Quest;
    onSubmit: (data: Partial<Quest>) => Promise<void>;
    onCancel: () => void;
}

const QuestForm: React.FC<QuestFormProps> = ({ initial, onSubmit, onCancel }) => {
    const { player } = useGame();
    const [title, setTitle] = useState(initial?.title ?? '');
    const [notes, setNotes] = useState(initial?.notes ?? '');
    const [size, setSize] = useState<QuestSize>(initial?.size ?? 'small');
    const [attribute, setAttribute] = useState<Attribute>(initial?.attribute ?? 'discipline');
    const [deadline, setDeadline] = useState(initial?.deadline ?? '');
    const [penalizeOverdue, setPenalizeOverdue] = useState(initial?.penalizeOverdue ?? false);
    const [customize, setCustomize] = useState(initial?.customXp != null || initial?.customGold != null);
    const [customXp, setCustomXp] = useState(initial?.customXp?.toString() ?? '');
    const [customGold, setCustomGold] = useState(initial?.customGold?.toString() ?? '');
    const [saving, setSaving] = useState(false);

    const parseCustom = (v: string) => {
        if (!customize || v.trim() === '') return null;
        const n = parseInt(v);
        return isNaN(n) || n < 0 ? null : n;
    };

    const draft = { size, deadline: deadline || null, customXp: parseCustom(customXp), customGold: parseCustom(customGold) };
    const mode = player?.mode ?? 'normal';
    const preview = computeQuestReward(draft, todayStr(), mode);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        setSaving(true);
        try {
            await onSubmit({
                title: title.trim(), notes: notes.trim() || null, size, attribute,
                deadline: deadline || null, penalizeOverdue: !!deadline && penalizeOverdue,
                customXp: draft.customXp, customGold: draft.customGold,
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{initial ? 'Editar misión' : 'Nueva misión'}</h3>
                <button type="button" onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800">
                    <X size={18} />
                </button>
            </div>

            <input
                autoFocus
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="ej. Renovar el pasaporte, terminar el curso de inglés..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 outline-none text-lg"
            />

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tamaño</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(QUEST_PRESETS) as QuestSize[]).map(key => {
                        const p = QUEST_PRESETS[key];
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSize(key)}
                                title={p.hint}
                                className={cn(
                                    "rounded-xl border px-3 py-2 text-left transition-all",
                                    size === key ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-100 dark:ring-indigo-500/20" : "border-slate-200 dark:border-zinc-700 hover:border-slate-300"
                                )}
                            >
                                <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">{p.label}</span>
                                <span className="block text-[11px] text-slate-500">+{p.xp} XP +{p.gold} 🪙</span>
                            </button>
                        );
                    })}
                </div>
                <p className="mt-1.5 text-xs text-slate-400">{QUEST_PRESETS[size].hint}</p>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Atributo</label>
                <div className="flex flex-wrap gap-2">
                    {ATTRIBUTE_KEYS.map(key => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setAttribute(key)}
                            className={cn("px-3 py-1.5 rounded-full border text-xs font-bold transition-all",
                                attribute === key ? "border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" : "border-slate-200 dark:border-zinc-700 text-slate-500")}
                        >
                            {ATTRIBUTES[key].icon} {ATTRIBUTES[key].label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Fecha límite (opcional)
                    <input
                        type="date"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                        className="mt-2 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent font-normal"
                    />
                </label>
                {deadline && (
                    <label className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 sm:mt-8">
                        <input type="checkbox" checked={penalizeOverdue} onChange={e => setPenalizeOverdue(e.target.checked)} className="mt-1" />
                        <span>Penalizar si vence <span className="text-slate-400">(−10% del oro)</span></span>
                    </label>
                )}
            </div>

            <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notas (opcional)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent text-sm"
            />

            <div className="rounded-xl border border-slate-200 dark:border-zinc-700 p-4">
                <button
                    type="button"
                    onClick={() => setCustomize(c => !c)}
                    className="w-full flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300"
                >
                    <span className="flex items-center gap-2"><SlidersHorizontal size={16} /> Personalizar recompensa</span>
                    <span className={cn("w-9 h-5 rounded-full p-0.5 transition-colors", customize ? "bg-indigo-600" : "bg-slate-300 dark:bg-zinc-700")}>
                        <span className={cn("block w-4 h-4 rounded-full bg-white transition-transform", customize && "translate-x-4")} />
                    </span>
                </button>
                {customize && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <label className="text-xs font-medium text-slate-500">
                            XP
                            <input type="number" min="0" value={customXp} onChange={e => setCustomXp(e.target.value)}
                                placeholder={String(QUEST_PRESETS[size].xp)}
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent" />
                        </label>
                        <label className="text-xs font-medium text-slate-500">
                            Oro
                            <input type="number" min="0" value={customGold} onChange={e => setCustomGold(e.target.value)}
                                placeholder={String(QUEST_PRESETS[size].gold)}
                                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent" />
                        </label>
                    </div>
                )}
                <p className="mt-3 text-xs text-slate-500">
                    Al completarla: <b className="text-indigo-600 dark:text-indigo-400">+{preview.xp} XP +{preview.gold} 🪙</b>
                    {preview.onTime && <span className="text-emerald-600"> (incluye +25% por estar a tiempo)</span>}
                    {' '}· cada paso del checklist: +{computeQuestStepXp(mode)} XP
                </p>
            </div>

            <button
                type="submit"
                disabled={!title.trim() || saving}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold transition-colors flex items-center justify-center gap-2"
            >
                <Check size={18} /> {initial ? 'Guardar cambios' : 'Aceptar misión'}
            </button>
        </form>
    );
};

// --- Card ---

const DeadlineBadge: React.FC<{ deadline: string }> = ({ deadline }) => {
    const days = differenceInCalendarDays(parseLocalDate(deadline), new Date());
    const text = days < 0 ? `Vencida hace ${-days} d` : days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `Faltan ${days} días`;
    return (
        <span className={cn(
            "text-[11px] font-bold px-2 py-0.5 rounded-full",
            days < 0 ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                : days <= 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400"
                    : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400"
        )}>
            {text}
        </span>
    );
};

interface QuestCardProps {
    quest: Quest;
    onChange: (q: Quest) => void;
    onRemove: (id: string) => void;
    onEdit: (q: Quest) => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, onChange, onRemove, onEdit }) => {
    const { player, applyGame, notify } = useGame();
    const [newStep, setNewStep] = useState('');
    const [busy, setBusy] = useState(false);
    const mode = player?.mode ?? 'normal';
    const done = quest.status === 'done';
    const reward = computeQuestReward(quest, todayStr(), mode);
    const attr = ATTRIBUTES[quest.attribute ?? 'discipline'];
    const stepsDone = quest.steps.filter(s => s.done).length;

    const run = async (fn: () => Promise<void>) => {
        setBusy(true);
        try { await fn(); } catch (err) { notify(err instanceof Error ? err.message : 'Algo salió mal'); } finally { setBusy(false); }
    };

    const complete = () => run(async () => {
        const { quest: q, game } = await api.quests.complete(quest.id, todayStr());
        applyGame(game);
        onChange(q);
    });

    const reopen = () => run(async () => {
        const { quest: q, game } = await api.quests.reopen(quest.id);
        applyGame(game);
        onChange(q);
    });

    const remove = () => {
        const warning = done ? 'La recompensa ya ganada se conserva.' : 'Se revierte el XP de los pasos completados.';
        if (!confirm(`¿Eliminar la misión "${quest.title}"? ${warning}`)) return;
        run(async () => {
            const { game } = await api.quests.delete(quest.id);
            applyGame(game);
            onRemove(quest.id);
        });
    };

    const addStep = (e: React.FormEvent) => {
        e.preventDefault();
        const title = newStep.trim();
        if (!title) return;
        setNewStep('');
        run(async () => {
            const step = await api.quests.addStep(quest.id, title);
            onChange({ ...quest, steps: [...quest.steps, step] });
        });
    };

    const toggleStep = (stepId: string) => run(async () => {
        const { step, game } = await api.quests.toggleStep(stepId, todayStr());
        applyGame(game);
        onChange({ ...quest, steps: quest.steps.map(s => s.id === stepId ? step : s) });
    });

    const deleteStep = (stepId: string) => run(async () => {
        const { game } = await api.quests.deleteStep(stepId);
        applyGame(game);
        onChange({ ...quest, steps: quest.steps.filter(s => s.id !== stepId) });
    });

    return (
        <div className={cn(
            "bg-white dark:bg-zinc-900 rounded-2xl border p-5 shadow-sm group transition-opacity",
            done ? "border-emerald-200 dark:border-emerald-900 opacity-75" : "border-slate-200 dark:border-zinc-800",
            busy && "pointer-events-none opacity-60"
        )}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                            {QUEST_PRESETS[quest.size]?.label ?? quest.size}
                        </span>
                        <span className="text-xs" title={attr.label}>{attr.icon}</span>
                        {quest.deadline && !done && <DeadlineBadge deadline={quest.deadline} />}
                        {quest.penalizeOverdue && !done && (
                            <span className="text-[11px] text-red-500" title="Si vence perdés oro">
                                −{computeQuestOverduePenalty(quest, mode)} 🪙 si vence
                            </span>
                        )}
                    </div>
                    <h3 className={cn("font-bold text-lg text-slate-800 dark:text-slate-100", done && "line-through decoration-2 decoration-emerald-500/60")}>
                        {quest.title}
                    </h3>
                    {quest.notes && <p className="text-sm text-slate-500 mt-1 whitespace-pre-line">{quest.notes}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!done && (
                        <button onClick={() => onEdit(quest)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg" title="Editar">
                            <Pencil size={14} />
                        </button>
                    )}
                    <button onClick={remove} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg" title="Eliminar">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Steps */}
            {(quest.steps.length > 0 || !done) && (
                <div className="mt-4 space-y-1.5">
                    {quest.steps.length > 0 && (
                        <p className="text-xs font-bold text-slate-400">Pasos {stepsDone}/{quest.steps.length}</p>
                    )}
                    {quest.steps.map(step => (
                        <div key={step.id} className="flex items-center gap-2 group/step">
                            <button
                                onClick={() => !done && toggleStep(step.id)}
                                disabled={done}
                                className={cn(
                                    "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                                    step.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-zinc-600 hover:border-indigo-400"
                                )}
                            >
                                {step.done && <Check size={12} strokeWidth={3} />}
                            </button>
                            <span className={cn("text-sm flex-1", step.done ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300")}>
                                {step.title}
                            </span>
                            {!done && (
                                <button onClick={() => deleteStep(step.id)} className="opacity-0 group-hover/step:opacity-100 p-0.5 text-slate-300 hover:text-red-500">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                    {!done && (
                        <form onSubmit={addStep} className="flex items-center gap-2 pt-1">
                            <Plus size={16} className="text-slate-300" />
                            <input
                                value={newStep}
                                onChange={e => setNewStep(e.target.value)}
                                placeholder={`Agregar paso (+${computeQuestStepXp(mode)} XP)`}
                                className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-300 dark:placeholder:text-zinc-600 py-1"
                            />
                        </form>
                    )}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                <DeltaChips xp={reward.xp} gold={reward.gold} suffix={reward.onTime && !done ? '+25% a tiempo' : undefined} />
                {done ? (
                    <button onClick={reopen} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                        <RotateCcw size={14} /> Reabrir
                    </button>
                ) : (
                    <button
                        onClick={complete}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                        <Check size={16} /> Completar
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Page ---

const QuestsView: React.FC = () => {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Quest | null>(null);
    const [showDone, setShowDone] = useState(false);
    const { notify } = useGame();

    useEffect(() => {
        api.quests.list()
            .then(setQuests)
            .catch(() => notify('No se pudieron cargar las misiones'))
            .finally(() => setLoading(false));
    }, [notify]);

    const replace = (q: Quest) => setQuests(prev => prev.map(x => x.id === q.id ? q : x));
    const remove = (id: string) => setQuests(prev => prev.filter(x => x.id !== id));

    const create = async (data: Partial<Quest>) => {
        const q = await api.quests.create(data);
        setQuests(prev => [q, ...prev]);
        setShowForm(false);
    };

    const update = async (data: Partial<Quest>) => {
        if (!editing) return;
        const q = await api.quests.update(editing.id, data);
        replace(q);
        setEditing(null);
    };

    // Open quests: overdue / nearest deadline first, then newest
    const open = quests.filter(q => q.status === 'open').sort((a, b) => {
        if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return 0;
    });
    const done = quests.filter(q => q.status === 'done')
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Misiones</h2>
                    <p className="text-slate-500 mt-1">Pendientes y proyectos puntuales. Más grandes, más botín.</p>
                </div>
                {!showForm && !editing && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all active:scale-95"
                    >
                        <Plus size={20} /> Nueva misión
                    </button>
                )}
            </div>

            {showForm && <QuestForm onSubmit={create} onCancel={() => setShowForm(false)} />}
            {editing && <QuestForm initial={editing} onSubmit={update} onCancel={() => setEditing(null)} />}

            {loading ? (
                <div className="grid md:grid-cols-2 gap-4">
                    {[0, 1].map(i => <div key={i} className="h-40 rounded-2xl bg-slate-100 dark:bg-zinc-900 animate-pulse" />)}
                </div>
            ) : open.length === 0 && !showForm ? (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-700">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 mb-4">
                        <Scroll size={30} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No hay misiones activas</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2">
                        Ese trámite que venís pateando o ese proyecto grande: convertilos en una misión y cobrá la recompensa.
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {open.map(q => (
                        <QuestCard key={q.id} quest={q} onChange={replace} onRemove={remove} onEdit={(x) => { setShowForm(false); setEditing(x); }} />
                    ))}
                </div>
            )}

            {done.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowDone(s => !s)}
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                        <ChevronDown size={16} className={cn("transition-transform", showDone && "rotate-180")} />
                        Completadas ({done.length})
                    </button>
                    {showDone && (
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                            {done.map(q => (
                                <QuestCard key={q.id} quest={q} onChange={replace} onRemove={remove} onEdit={setEditing} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuestsView;
