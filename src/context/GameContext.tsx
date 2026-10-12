import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { format } from 'date-fns';
import { api } from '../api/client';
import type { DifficultyMode, GameDelta, GamePayload, JudgmentDay, PlayerState } from '../types/game';

export interface Toast extends GameDelta {
    id: number;
}

interface LevelUp {
    level: number;
    title: string;
    newTitle: boolean;
}

interface GameContextType {
    player: PlayerState | null;
    toasts: Toast[];
    levelUp: LevelUp | null;
    report: JudgmentDay[] | null;
    gameError: string | null;
    applyGame: (game?: GamePayload | null) => void;
    notify: (message: string) => void;
    dismissLevelUp: () => void;
    dismissReport: () => void;
    purchase: (data: { rewardId?: string; item?: 'potion' | 'shield' }) => Promise<boolean>;
    setMode: (mode: DifficultyMode) => Promise<void>;
    refresh: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const TOAST_MS = 3200;
export const todayStr = () => format(new Date(), 'yyyy-MM-dd');

// A judgment report is only worth a modal if something actually happened
const isEventfulReport = (days: JudgmentDay[]) =>
    days.some(d => d.total > 0 || d.cleanDays > 0 || d.death || d.overdue > 0);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [player, setPlayer] = useState<PlayerState | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [levelUp, setLevelUp] = useState<LevelUp | null>(null);
    const [report, setReport] = useState<JudgmentDay[] | null>(null);
    const [gameError, setGameError] = useState<string | null>(null);
    const playerRef = useRef<PlayerState | null>(null);
    const toastId = useRef(0);
    const judgedFor = useRef<string | null>(null);

    const pushToasts = useCallback((deltas: GameDelta[]) => {
        if (deltas.length === 0) return;
        const created = deltas.map(d => ({ ...d, id: ++toastId.current }));
        setToasts(prev => [...prev, ...created].slice(-6));
        created.forEach(t => setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), TOAST_MS));
    }, []);

    const updatePlayer = useCallback((next: PlayerState) => {
        const prev = playerRef.current;
        if (prev && next.level > prev.level) {
            setLevelUp({ level: next.level, title: next.title, newTitle: next.title !== prev.title });
        }
        playerRef.current = next;
        setPlayer(next);
    }, []);

    const applyGame = useCallback((game?: GamePayload | null) => {
        if (!game) return;
        pushToasts(game.deltas);
        updatePlayer(game.player);
    }, [pushToasts, updatePlayer]);

    const notify = useCallback((message: string) => {
        pushToasts([{ label: message, xp: 0, gold: 0, hp: 0, tone: 'info' }]);
    }, [pushToasts]);

    const judge = useCallback(async () => {
        const today = todayStr();
        if (judgedFor.current === today) return;
        judgedFor.current = today;
        try {
            const { report: days, game } = await api.game.judge(today);
            updatePlayer(game.player);
            if (isEventfulReport(days)) setReport(days);
        } catch (err) {
            console.error(err);
            judgedFor.current = null;
            setGameError('No se pudo cargar el personaje');
        }
    }, [updatePlayer]);

    // Judge pending days on load, and again when the app comes back on a new day
    useEffect(() => {
        judge();
        const onVisible = () => { if (document.visibilityState === 'visible') judge(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [judge]);

    const refresh = useCallback(async () => {
        const { player: p } = await api.game.state();
        updatePlayer(p);
    }, [updatePlayer]);

    const purchase = useCallback(async (data: { rewardId?: string; item?: 'potion' | 'shield' }) => {
        try {
            const { game } = await api.game.purchase({ ...data, today: todayStr() });
            applyGame(game);
            return true;
        } catch (err) {
            notify(err instanceof Error ? err.message : 'No se pudo comprar');
            return false;
        }
    }, [applyGame, notify]);

    const setMode = useCallback(async (mode: DifficultyMode) => {
        const { game } = await api.game.setMode(mode);
        applyGame(game);
    }, [applyGame]);

    return (
        <GameContext.Provider value={{
            player, toasts, levelUp, report, gameError, applyGame, notify,
            dismissLevelUp: () => setLevelUp(null),
            dismissReport: () => setReport(null),
            purchase, setMode, refresh,
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
