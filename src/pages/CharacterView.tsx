import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Coins, Flame, Heart, Shield } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { api } from '../api/client';
import { useGame } from '../context/GameContext';
import { ATTRIBUTES, ATTRIBUTE_KEYS, LEVEL_TITLES, MODES } from '../game/rules';
import type { DifficultyMode, GameEvent } from '../types/game';
import { cn } from '../utils/cn';
import ProgressBar from '../components/game/ProgressBar';
import DeltaChips from '../components/game/DeltaChips';

const EVENT_ICONS: Record<string, string> = {
    habit: '✅', habit_goal: '🎯', bad_habit: '💀', perfect_day: '⭐', quest: '🗡️', quest_step: '☑️',
    overdue: '⌛', purchase: '🎁', potion: '🧪', shield: '🛡️', judgment: '🌙', death: '☠️',
};

const CharacterView: React.FC = () => {
    const { player, setMode, notify } = useGame();
    const [history, setHistory] = useState<GameEvent[]>([]);

    useEffect(() => {
        api.game.history(40).then(setHistory).catch(() => undefined);
    }, [player?.xp, player?.gold]);

    if (!player) {
        return <div className="p-8 text-center text-slate-400">Cargando personaje…</div>;
    }

    const radarData = ATTRIBUTE_KEYS.map(key => {
        const a = player.attributes[key];
        return {
            attribute: `${ATTRIBUTES[key].icon} ${ATTRIBUTES[key].label}`,
            value: a.level - 1 + a.xpIntoLevel / a.xpForNext,
        };
    });

    const nextTitle = [...LEVEL_TITLES].reverse().find(t => t.level > player.level);

    const changeMode = async (mode: DifficultyMode) => {
        if (mode === player.mode) return;
        if (!confirm(`¿Cambiar a modo ${MODES[mode].label}? ${MODES[mode].description}`)) return;
        try {
            await setMode(mode);
        } catch {
            notify('No se pudo cambiar el modo');
        }
    };

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white p-6 shadow-xl shadow-indigo-500/20">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold uppercase opacity-80">Nivel</span>
                        <span className="text-4xl font-black leading-none">{player.level}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-3xl font-black">{player.title}</h2>
                        <p className="text-sm text-white/80">
                            {player.xp} XP totales{nextTitle && ` · "${nextTitle.title}" en nivel ${nextTitle.level}`}
                        </p>
                    </div>
                </div>
                <div className="mt-5 space-y-3">
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span>Experiencia</span><span className="tabular-nums">{player.xpIntoLevel}/{player.xpForNext}</span>
                        </div>
                        <ProgressBar value={player.xpIntoLevel} max={player.xpForNext} className="bg-white/20 h-2.5" barClassName="bg-white" />
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                            <span className="flex items-center gap-1"><Heart size={12} className="fill-white" /> Vida</span>
                            <span className="tabular-nums">{player.hp}/{player.maxHp}</span>
                        </div>
                        <ProgressBar value={player.hp} max={player.maxHp} className="bg-white/20 h-2.5" barClassName="bg-rose-300" />
                    </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white/10 py-2">
                        <Coins size={16} className="mx-auto" />
                        <p className="text-lg font-black tabular-nums">{player.gold}</p>
                        <p className="text-[10px] uppercase opacity-70">Oro</p>
                    </div>
                    <div className="rounded-xl bg-white/10 py-2">
                        <Flame size={16} className="mx-auto" />
                        <p className="text-lg font-black tabular-nums">{player.combo}</p>
                        <p className="text-[10px] uppercase opacity-70">Combo ×{player.comboMultiplier.toFixed(2)}</p>
                    </div>
                    <div className="rounded-xl bg-white/10 py-2">
                        <Shield size={16} className="mx-auto" />
                        <p className="text-lg font-black tabular-nums">{player.shields}</p>
                        <p className="text-[10px] uppercase opacity-70">Escudos</p>
                    </div>
                </div>
            </section>

            {/* Attributes */}
            <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Atributos</h3>
                <div className="grid md:grid-cols-2 gap-4 items-center">
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData} outerRadius="70%">
                                <PolarGrid stroke="currentColor" className="text-slate-200 dark:text-zinc-700" />
                                <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} isAnimationActive />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                        {ATTRIBUTE_KEYS.map(key => {
                            const a = player.attributes[key];
                            const meta = ATTRIBUTES[key];
                            return (
                                <div key={key}>
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{meta.icon} {meta.label}</span>
                                        <span className="text-xs text-slate-400 tabular-nums">Nv {a.level} · {a.xpIntoLevel}/{a.xpForNext}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(a.xpIntoLevel / a.xpForNext) * 100}%`, backgroundColor: meta.color }} />
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{meta.hint}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Difficulty mode */}
            <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Modo de dificultad</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Escala los premios y castigos de todo el juego. Recomendado: empezá en Normal dos semanas; si nunca bajás de 70% de vida, subí a Difícil.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    {(Object.keys(MODES) as DifficultyMode[]).map(key => {
                        const m = MODES[key];
                        const active = player.mode === key;
                        return (
                            <button
                                key={key}
                                onClick={() => changeMode(key)}
                                className={cn(
                                    "text-left rounded-2xl border p-4 transition-all",
                                    active ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 ring-2 ring-indigo-100 dark:ring-indigo-500/20" : "border-slate-200 dark:border-zinc-700 hover:border-slate-300"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{m.label}</span>
                                    {active && <span className="text-[10px] font-bold text-indigo-600 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-full">ACTIVO</span>}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                                <ul className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                                    <li>Premios ×{m.reward} · Castigos ×{m.penalty}</li>
                                    <li>{m.missedDaily > 0 ? `Dailies incumplidas dañan ×${m.missedDaily}` : 'Sin daño por dailies'}</li>
                                    <li>Derrota: −{Math.round(m.deathGoldPct * 100)}% oro{m.deathResetsCombo ? ', combo a 0' : ''}{m.deathLosesLevel ? ', −1 nivel' : ''}</li>
                                </ul>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* History */}
            <section className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-5">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">Historial</h3>
                {history.length === 0 ? (
                    <p className="text-sm text-slate-500">Todavía no hay movimientos. Completá un hábito para empezar tu aventura.</p>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {history.map(ev => (
                            <div key={ev.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0 flex items-center gap-2">
                                    <span className="text-base">{EVENT_ICONS[ev.type] ?? '•'}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                                            {ev.label ?? ev.type}
                                            {ev.meta?.crit && <span className="ml-1 text-[10px] font-black text-amber-500">CRÍTICO</span>}
                                        </p>
                                        <p className="text-[11px] text-slate-400">{format(new Date(ev.createdAt), "d MMM, HH:mm", { locale: es })}</p>
                                    </div>
                                </div>
                                <DeltaChips xp={ev.xp} gold={ev.gold} hp={ev.type === 'judgment' || ev.type === 'bad_habit' || ev.type === 'potion' ? ev.hp : 0} className="flex-shrink-0 justify-end" />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default CharacterView;
