import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGame } from '../../context/GameContext';
import { parseLocalDate } from '../../utils/dateHelpers';
import { cn } from '../../utils/cn';
import DeltaChips from './DeltaChips';

const DailyReportModal: React.FC = () => {
    const { report, dismissReport, player } = useGame();
    if (!report || report.length === 0) return null;

    const totalDamage = report.reduce((a, d) => a + d.damage, 0);
    const totalRegen = report.reduce((a, d) => a + d.regen, 0);
    const totalCleanXp = report.reduce((a, d) => a + d.cleanXp, 0);
    const totalOverdue = report.reduce((a, d) => a + d.overdue, 0);
    const died = report.some(d => d.death);

    return (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={dismissReport} />
            <div className="relative bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl p-6 max-h-[85vh] overflow-y-auto">
                <p className="text-xs font-bold tracking-[0.2em] text-indigo-500 uppercase">Reporte del día</p>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {died ? '💀 Caíste en batalla' : totalDamage > totalRegen ? '⚔️ Recibiste daño' : '🌅 Un nuevo día'}
                </h2>

                <div className="mt-4 space-y-2">
                    {report.map(d => (
                        <div key={d.date} className={cn(
                            "rounded-xl border p-3",
                            d.death ? "border-rose-300 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-500/40"
                                : d.perfect ? "border-amber-200 bg-amber-50/60 dark:bg-amber-500/5 dark:border-amber-500/30"
                                    : "border-slate-200 dark:border-zinc-800"
                        )}>
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-slate-800 dark:text-slate-100 first-letter:uppercase">
                                    {format(parseLocalDate(d.date), "EEEE d 'de' MMM", { locale: es })}
                                </span>
                                {d.total > 0 && (
                                    <span className="text-xs font-bold text-slate-500">{d.completed}/{d.total} dailies{d.perfect && ' ⭐'}</span>
                                )}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                                {d.damage > 0 && <span className="text-rose-600 dark:text-rose-400">−{d.damage} ❤️ por dailies incumplidas</span>}
                                {d.regen > 0 && <span className="text-emerald-600 dark:text-emerald-400">+{d.regen} ❤️ Día Perfecto</span>}
                                {d.cleanDays > 0 && (
                                    <span className="text-violet-600 dark:text-violet-400">
                                        🧘 {d.cleanDays} {d.cleanDays > 1 ? 'malos hábitos evitados' : 'mal hábito evitado'} (+{d.cleanXp} XP)
                                    </span>
                                )}
                                {d.overdue > 0 && <span className="text-red-600">−{d.overdue} 🪙 misiones vencidas</span>}
                                {d.shieldUsed && <span className="text-sky-600">🛡️ Escudo usado</span>}
                                {d.comboBroken && <span className="text-orange-600">🔥 Combo perdido</span>}
                                {!d.comboBroken && d.total > 0 && <span className="text-orange-500">🔥 Combo {d.comboAfter}</span>}
                                {d.death && <span className="font-bold text-rose-600">💀 Derrota</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 dark:bg-zinc-800/60 p-3">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Total</span>
                    <DeltaChips xp={totalCleanXp} gold={-totalOverdue} hp={totalRegen - totalDamage} />
                </div>
                {player && (
                    <p className="mt-2 text-xs text-center text-slate-500">
                        Vida actual: {player.hp}/{player.maxHp} ❤️ · Combo: {player.combo} 🔥
                    </p>
                )}

                <button
                    onClick={dismissReport}
                    className="mt-5 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors"
                >
                    A por el día de hoy
                </button>
            </div>
        </div>
    );
};

export default DailyReportModal;
