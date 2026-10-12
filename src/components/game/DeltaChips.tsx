import React from 'react';
import { cn } from '../../utils/cn';

interface DeltaChipsProps {
    xp?: number;
    gold?: number;
    hp?: number;
    className?: string;
    suffix?: string;
}

const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** Compact "+20 XP · +10 🪙 · -5 ❤️" chips. */
const DeltaChips: React.FC<DeltaChipsProps> = ({ xp = 0, gold = 0, hp = 0, className, suffix }) => (
    <span className={cn("inline-flex flex-wrap items-center gap-1 text-[11px] font-bold", className)}>
        {xp !== 0 && (
            <span className={cn("px-1.5 py-0.5 rounded-md", xp > 0 ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" : "bg-slate-100 text-slate-500 dark:bg-zinc-800")}>
                {fmt(xp)} XP
            </span>
        )}
        {gold !== 0 && (
            <span className={cn("px-1.5 py-0.5 rounded-md", gold > 0 ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400")}>
                {fmt(gold)} 🪙
            </span>
        )}
        {hp !== 0 && (
            <span className={cn("px-1.5 py-0.5 rounded-md", hp > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400")}>
                {fmt(hp)} ❤️
            </span>
        )}
        {suffix && <span className="text-slate-400 font-medium">{suffix}</span>}
    </span>
);

export default DeltaChips;
