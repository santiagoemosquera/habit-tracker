import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Coins, Pencil, Plus, Trash2, X, Check } from 'lucide-react';
import { api } from '../api/client';
import { useGame } from '../context/GameContext';
import { SHOP_ITEMS } from '../game/rules';
import type { GameEvent, Reward } from '../types/game';
import { cn } from '../utils/cn';

const PRICE_GUIDE = [
    { label: 'Pequeños', range: '20–60', examples: 'Café especial, 1 episodio, 30 min de videojuegos' },
    { label: 'Medianos', range: '100–250', examples: 'Salida a comer, cine, una mañana libre' },
    { label: 'Grandes', range: '500–1500', examples: 'Libro o juego nuevo, ropa, escapada de finde' },
];

const EMOJI_SUGGESTIONS = ['🎁', '☕', '🍕', '🎮', '🎬', '📺', '🍦', '🛍️', '📚', '🏖️', '🍺', '😴'];

// --- Reward form ---

interface RewardFormProps {
    initial?: Reward;
    onSubmit: (data: Partial<Reward>) => Promise<void>;
    onCancel: () => void;
}

const RewardForm: React.FC<RewardFormProps> = ({ initial, onSubmit, onCancel }) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [emoji, setEmoji] = useState(initial?.emoji ?? '🎁');
    const [cost, setCost] = useState(initial?.cost?.toString() ?? '50');
    const [note, setNote] = useState(initial?.note ?? '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseInt(cost);
        if (!name.trim() || isNaN(parsed) || parsed < 1) return;
        await onSubmit({ name: name.trim(), emoji, cost: parsed, note: note.trim() || null });
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{initial ? 'Editar premio' : 'Nuevo premio'}</h3>
                <button type="button" onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800">
                    <X size={18} />
                </button>
            </div>
            <div className="flex gap-3">
                <input
                    value={emoji}
                    onChange={e => setEmoji(e.target.value)}
                    className="w-14 text-center text-2xl px-2 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent"
                    maxLength={4}
                    aria-label="Emoji"
                />
                <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="ej. Pedir sushi, comprarme un juego..."
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent focus:border-indigo-500 outline-none"
                />
            </div>
            <div className="flex flex-wrap gap-1">
                {EMOJI_SUGGESTIONS.map(e => (
                    <button key={e} type="button" onClick={() => setEmoji(e)}
                        className={cn("w-8 h-8 rounded-lg text-lg hover:bg-slate-100 dark:hover:bg-zinc-800", emoji === e && "bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-300")}>
                        {e}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-3">
                <label className="text-xs font-bold text-slate-500">
                    Precio 🪙
                    <input type="number" min="1" value={cost} onChange={e => setCost(e.target.value)}
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent text-base text-slate-800 dark:text-slate-100" />
                </label>
                <label className="text-xs font-bold text-slate-500">
                    Nota (opcional)
                    <input value={note} onChange={e => setNote(e.target.value)} placeholder="ej. máximo 1 por semana"
                        className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent text-base font-normal text-slate-800 dark:text-slate-100" />
                </label>
            </div>
            <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold transition-colors flex items-center justify-center gap-2"
            >
                <Check size={18} /> {initial ? 'Guardar' : 'Agregar a la tienda'}
            </button>
        </form>
    );
};

// --- Item card ---

interface ShopCardProps {
    emoji: string;
    name: string;
    cost: number;
    note?: string | null;
    gold: number;
    disabledReason?: string;
    onBuy: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    system?: boolean;
}

const ShopCard: React.FC<ShopCardProps> = ({ emoji, name, cost, note, gold, disabledReason, onBuy, onEdit, onDelete, system }) => {
    const missing = cost - gold;
    const affordable = missing <= 0;
    const reason = disabledReason ?? (affordable ? undefined : `Te faltan ${missing} 🪙`);

    return (
        <div className={cn(
            "relative bg-white dark:bg-zinc-900 rounded-2xl border p-4 flex flex-col group",
            system ? "border-sky-200 dark:border-sky-900" : "border-slate-200 dark:border-zinc-800"
        )}>
            {(onEdit || onDelete) && (
                <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-indigo-600" title="Editar"><Pencil size={13} /></button>}
                    {onDelete && <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-500" title="Quitar de la tienda"><Trash2 size={13} /></button>}
                </div>
            )}
            <div className="text-4xl mb-2">{emoji}</div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 leading-tight">{name}</h3>
            {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
            <div className="mt-auto pt-4">
                {/* Progress toward the price makes the next reward feel close */}
                {!affordable && (
                    <div className="h-1 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.max(0, Math.min(100, (gold / cost) * 100))}%` }} />
                    </div>
                )}
                <button
                    onClick={onBuy}
                    disabled={!!reason}
                    title={reason}
                    className={cn(
                        "w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-black transition-all",
                        reason
                            ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed"
                            : "bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/20 active:scale-95"
                    )}
                >
                    <Coins size={14} /> {cost}
                </button>
                {reason && <p className="text-[11px] text-center text-slate-400 mt-1">{reason}</p>}
            </div>
        </div>
    );
};

// --- Page ---

const ShopView: React.FC = () => {
    const { player, purchase, notify } = useGame();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [history, setHistory] = useState<GameEvent[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Reward | null>(null);

    const loadHistory = () => api.game.history(20, 'purchase').then(setHistory).catch(() => undefined);

    useEffect(() => {
        api.game.rewards.list().then(setRewards).catch(() => notify('No se pudo cargar la tienda'));
        loadHistory();
    }, [notify]);

    const gold = player?.gold ?? 0;

    const buy = async (data: { rewardId?: string; item?: 'potion' | 'shield' }, label: string, cost: number) => {
        if (!confirm(`¿Canjear "${label}" por ${cost} 🪙?`)) return;
        const ok = await purchase(data);
        if (ok && data.rewardId) loadHistory();
    };

    const create = async (data: Partial<Reward>) => {
        const r = await api.game.rewards.create(data);
        setRewards(prev => [...prev, r].sort((a, b) => a.cost - b.cost));
        setShowForm(false);
    };

    const update = async (data: Partial<Reward>) => {
        if (!editing) return;
        const r = await api.game.rewards.update(editing.id, data);
        setRewards(prev => prev.map(x => x.id === r.id ? r : x).sort((a, b) => a.cost - b.cost));
        setEditing(null);
    };

    const remove = async (r: Reward) => {
        if (!confirm(`¿Quitar "${r.name}" de la tienda?`)) return;
        await api.game.rewards.delete(r.id);
        setRewards(prev => prev.filter(x => x.id !== r.id));
    };

    const hpFull = !!player && player.hp >= player.maxHp;
    const shieldsFull = !!player && player.shields >= SHOP_ITEMS.shield.max;

    return (
        <div className="p-4 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Tienda</h2>
                    <p className="text-slate-500 mt-1">Canjeá tu oro por premios reales. Te los ganaste.</p>
                </div>
                <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-2xl tabular-nums",
                    gold < 0 ? "bg-red-50 text-red-600 dark:bg-red-500/10" : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                )}>
                    <Coins size={22} /> {gold}
                    {gold < 0 && <span className="text-xs font-bold">en deuda</span>}
                </div>
            </div>

            {/* System items */}
            <section>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">Objetos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <ShopCard
                        system
                        emoji={SHOP_ITEMS.potion.emoji} name={SHOP_ITEMS.potion.name} cost={SHOP_ITEMS.potion.cost}
                        note={SHOP_ITEMS.potion.note} gold={gold}
                        disabledReason={hpFull ? 'Vida al máximo' : undefined}
                        onBuy={() => buy({ item: 'potion' }, SHOP_ITEMS.potion.name, SHOP_ITEMS.potion.cost)}
                    />
                    <ShopCard
                        system
                        emoji={SHOP_ITEMS.shield.emoji} name={SHOP_ITEMS.shield.name} cost={SHOP_ITEMS.shield.cost}
                        note={`${SHOP_ITEMS.shield.note}${player ? ` · tenés ${player.shields}` : ''}`} gold={gold}
                        disabledReason={shieldsFull ? 'Ya tenés el máximo' : undefined}
                        onBuy={() => buy({ item: 'shield' }, SHOP_ITEMS.shield.name, SHOP_ITEMS.shield.cost)}
                    />
                </div>
            </section>

            {/* Custom rewards */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Tus premios</h3>
                    {!showForm && !editing && (
                        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                            <Plus size={16} /> Nuevo premio
                        </button>
                    )}
                </div>

                {(showForm || editing) && (
                    <div className="mb-4">
                        {showForm && <RewardForm onSubmit={create} onCancel={() => setShowForm(false)} />}
                        {editing && <RewardForm initial={editing} onSubmit={update} onCancel={() => setEditing(null)} />}
                    </div>
                )}

                {rewards.length === 0 && !showForm ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700 p-6 text-center">
                        <p className="font-bold text-slate-700 dark:text-slate-200">Tu tienda está vacía</p>
                        <p className="text-sm text-slate-500 mt-1">Agregá cosas que realmente quieras: eso es lo que te va a hacer volver.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {rewards.map(r => (
                            <ShopCard
                                key={r.id}
                                emoji={r.emoji} name={r.name} cost={r.cost} note={r.note} gold={gold}
                                onBuy={() => buy({ rewardId: r.id }, r.name, r.cost)}
                                onEdit={() => { setShowForm(false); setEditing(r); }}
                                onDelete={() => remove(r)}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Price guide */}
            <section className="rounded-2xl bg-slate-50 dark:bg-zinc-900/60 p-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Guía de precios</h3>
                <p className="text-xs text-slate-500 mt-1">
                    Un día normal deja ~60–100 🪙. Un premio mediano debería costar 2–3 días buenos; uno grande, 2–3 semanas.
                </p>
                <div className="grid sm:grid-cols-3 gap-3 mt-3">
                    {PRICE_GUIDE.map(g => (
                        <div key={g.label} className="text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{g.label}</span>{' '}
                            <span className="text-amber-600 font-bold">{g.range} 🪙</span>
                            <p className="text-slate-500">{g.examples}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Purchase history */}
            {history.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-3">Canjes recientes</h3>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 divide-y divide-slate-100 dark:divide-zinc-800">
                        {history.map(ev => (
                            <div key={ev.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                <span className="text-slate-700 dark:text-slate-200">{ev.label}</span>
                                <span className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400">{format(new Date(ev.createdAt), "d MMM", { locale: es })}</span>
                                    <span className="font-bold text-amber-600 tabular-nums">{ev.gold} 🪙</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ShopView;
