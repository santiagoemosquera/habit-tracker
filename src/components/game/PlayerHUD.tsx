import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Flame, Heart, Shield, Sparkles } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { cn } from '../../utils/cn';
import ProgressBar from './ProgressBar';

const PlayerHUD: React.FC = () => {
    const { player, gameError } = useGame();
    const navigate = useNavigate();

    if (!player) {
        return (
            <div className="mx-4 mt-4 h-[76px] rounded-2xl bg-slate-100 dark:bg-zinc-900/60 animate-pulse flex items-center justify-center text-xs text-slate-400">
                {gameError}
            </div>
        );
    }

    const hpPct = player.hp / player.maxHp;

    return (
        <button
            onClick={() => navigate('/personaje')}
            className="mx-4 mt-4 w-[calc(100%-2rem)] text-left rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow p-3 flex items-center gap-3"
            title="Ver personaje"
        >
            {/* Level badge */}
            <div className="relative flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-[9px] font-bold uppercase leading-none opacity-80">Nv</span>
                <span className="text-lg font-black leading-none">{player.level}</span>
            </div>

            {/* Bars */}
            <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{player.title}</span>
                    <span className="text-[10px] font-medium text-slate-400 tabular-nums whitespace-nowrap">
                        {player.xpIntoLevel}/{player.xpForNext} XP
                    </span>
                </div>
                <ProgressBar value={player.xpIntoLevel} max={player.xpForNext} barClassName="bg-gradient-to-r from-indigo-500 to-violet-500" />
                <div className="flex items-center gap-2">
                    <Heart size={12} className="text-rose-500 fill-rose-500 flex-shrink-0" />
                    <ProgressBar
                        value={player.hp}
                        max={player.maxHp}
                        className="h-1.5"
                        barClassName={cn(hpPct > 0.5 ? "bg-rose-500" : hpPct > 0.25 ? "bg-orange-500" : "bg-red-600 animate-pulse")}
                    />
                    <span className="text-[10px] font-medium text-slate-400 tabular-nums whitespace-nowrap">{player.hp}/{player.maxHp}</span>
                </div>
            </div>

            {/* Currency + combo */}
            <div className="flex-shrink-0 flex flex-col items-end gap-1">
                <span className={cn(
                    "flex items-center gap-1 text-sm font-black tabular-nums",
                    player.gold < 0 ? "text-red-500" : "text-amber-500"
                )}>
                    <Coins size={14} /> {player.gold}
                </span>
                <span className="flex items-center gap-2 text-xs font-bold">
                    {player.shields > 0 && (
                        <span className="flex items-center gap-0.5 text-sky-500" title="Escudos de racha">
                            <Shield size={12} className="fill-sky-500/30" />{player.shields}
                        </span>
                    )}
                    <span
                        className={cn("flex items-center gap-0.5", player.combo > 0 ? "text-orange-500" : "text-slate-400")}
                        title={`Combo de ${player.combo} días: premios ×${player.comboMultiplier.toFixed(2)}`}
                    >
                        <Flame size={12} className={player.combo > 0 ? "fill-orange-500" : ""} />
                        {player.combo}
                        {player.combo > 0 && (
                            <span className="flex items-center text-[10px] text-orange-400 ml-0.5">
                                <Sparkles size={9} />×{player.comboMultiplier.toFixed(2)}
                            </span>
                        )}
                    </span>
                </span>
            </div>
        </button>
    );
};

export default PlayerHUD;
