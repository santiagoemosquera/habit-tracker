import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import { ATTRIBUTES } from '../../game/rules';
import { cn } from '../../utils/cn';
import DeltaChips from './DeltaChips';

const RewardToasts: React.FC = () => {
    const { toasts } = useGame();

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 w-[calc(100%-2rem)] max-w-sm pointer-events-none">
            <AnimatePresence initial={false}>
                {toasts.map(t => (
                    <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, y: 24, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: t.crit ? [1, 1.08, 1] : 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className={cn(
                            "w-full rounded-xl px-4 py-2.5 shadow-xl border backdrop-blur-md flex items-center justify-between gap-3",
                            t.tone === 'reward' && "bg-white/95 dark:bg-zinc-900/95 border-indigo-200 dark:border-indigo-500/30",
                            t.tone === 'penalty' && "bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-500/30",
                            t.tone === 'revert' && "bg-slate-50/95 dark:bg-zinc-900/95 border-slate-200 dark:border-zinc-700 opacity-80",
                            t.tone === 'info' && "bg-white/95 dark:bg-zinc-900/95 border-amber-200 dark:border-amber-500/30",
                        )}
                    >
                        <div className="min-w-0">
                            {(t.crit || !!t.drop) && (
                                <div className="flex items-center gap-1.5">
                                    {t.crit && <span className="text-[10px] font-black text-amber-500 tracking-wider">¡CRÍTICO! ORO ×2</span>}
                                    {!!t.drop && <span className="text-[10px] font-black text-emerald-500">🎁 COFRE +{t.drop}</span>}
                                </div>
                            )}
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {t.attribute && t.tone === 'reward' && <span className="mr-1">{ATTRIBUTES[t.attribute].icon}</span>}
                                {t.label}
                            </p>
                        </div>
                        <DeltaChips xp={t.xp} gold={t.gold} hp={t.hp} className="flex-shrink-0 justify-end" />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default RewardToasts;
