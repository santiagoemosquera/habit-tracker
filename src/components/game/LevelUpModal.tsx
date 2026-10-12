import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';

const LevelUpModal: React.FC = () => {
    const { levelUp, dismissLevelUp, player } = useGame();
    if (!levelUp) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={dismissLevelUp}>
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div
                initial={{ scale: 0.6, opacity: 0, rotate: -4 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border border-indigo-200 dark:border-indigo-500/30"
                onClick={e => e.stopPropagation()}
            >
                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="text-6xl mb-2"
                >
                    🏆
                </motion.div>
                <p className="text-xs font-bold tracking-[0.2em] text-indigo-500 uppercase">¡Subiste de nivel!</p>
                <h2 className="text-5xl font-black text-slate-900 dark:text-white mt-2">Nivel {levelUp.level}</h2>
                {levelUp.newTitle && (
                    <p className="mt-3 text-lg font-bold text-amber-500">Nuevo título: {levelUp.title}</p>
                )}
                {player && (
                    <p className="mt-3 text-sm text-slate-500">Vida máxima: {player.maxHp} ❤️</p>
                )}
                <button
                    onClick={dismissLevelUp}
                    className="mt-6 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors"
                >
                    ¡Vamos!
                </button>
            </motion.div>
        </div>
    );
};

export default LevelUpModal;
