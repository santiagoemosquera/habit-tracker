import type { GamePayload, GameEvent, JudgmentDay, PlayerState, Quest, QuestStep, Reward } from '../types/game';

const API_BASE = '/api';

// JSON request helper that surfaces the server's error message (e.g. "No te alcanza el oro")
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        let message = `Request failed (${res.status})`;
        try { message = (await res.json()).message || message; } catch { /* no body */ }
        throw new Error(message);
    }
    return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
    habits: {
        list: async () => {
            const res = await fetch(`${API_BASE}/habits`);
            if (!res.ok) throw new Error('Failed to fetch habits');
            return res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_BASE}/habits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create habit');
            return res.json();
        },
        update: async (id: string, updates: any) => {
            const res = await fetch(`${API_BASE}/habits/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update habit');
            return res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_BASE}/habits/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete habit');
            return true;
        }
    },
    logs: {
        list: async () => {
            const res = await fetch(`${API_BASE}/logs`);
            if (!res.ok) throw new Error('Failed to fetch logs');
            return res.json();
        },
        toggle: async (habitId: string, date: string, value: number) => {
            const res = await fetch(`${API_BASE}/logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ habitId, date, value }),
            });
            if (!res.ok) throw new Error('Failed to toggle log');
            return res.json();
        }
    },
    tasks: {
        list: async () => {
            const res = await fetch(`${API_BASE}/tasks`);
            if (!res.ok) throw new Error('Failed to fetch tasks');
            return res.json();
        },
        create: async (data: any) => {
            const res = await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to create task');
            return res.json();
        },
        update: async (id: string, updates: any) => {
            const res = await fetch(`${API_BASE}/tasks/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!res.ok) throw new Error('Failed to update task');
            return res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete task');
            return true;
        }
    },
    game: {
        state: () => request<{ player: PlayerState }>('/game?action=state'),
        history: (limit = 50, type?: string) =>
            request<GameEvent[]>(`/game?action=history&limit=${limit}${type ? `&type=${type}` : ''}`),
        judge: (today: string) => request<{ report: JudgmentDay[]; game: GamePayload }>('/game?action=judge', 'POST', { today }),
        purchase: (data: { rewardId?: string; item?: 'potion' | 'shield'; today: string }) =>
            request<{ game: GamePayload }>('/game?action=purchase', 'POST', data),
        reset: (today: string) => request<{ game: GamePayload }>('/game?action=reset', 'POST', { today }),
        setMode: (mode: string) => request<{ game: GamePayload }>('/game?action=settings', 'POST', { mode }),
        rewards: {
            list: () => request<Reward[]>('/game?action=rewards'),
            create: (data: Partial<Reward>) => request<Reward>('/game?action=rewards', 'POST', data),
            update: (id: string, data: Partial<Reward>) => request<Reward>(`/game?action=rewards&id=${id}`, 'PATCH', data),
            delete: (id: string) => request<void>(`/game?action=rewards&id=${id}`, 'DELETE'),
        },
    },
    quests: {
        list: () => request<Quest[]>('/quests'),
        create: (data: Partial<Quest>) => request<Quest>('/quests?action=create', 'POST', data),
        update: (id: string, data: Partial<Quest>) => request<Quest>(`/quests?action=update&id=${id}`, 'POST', data),
        delete: (id: string) => request<{ game: GamePayload }>(`/quests?action=delete&id=${id}`, 'POST', {}),
        complete: (id: string, today: string) =>
            request<{ quest: Quest; game: GamePayload }>(`/quests?action=complete&id=${id}`, 'POST', { today }),
        reopen: (id: string) => request<{ quest: Quest; game: GamePayload }>(`/quests?action=reopen&id=${id}`, 'POST', {}),
        addStep: (questId: string, title: string) => request<QuestStep>(`/quests?action=addStep&id=${questId}`, 'POST', { title }),
        toggleStep: (stepId: string, today: string) =>
            request<{ step: QuestStep; game: GamePayload }>(`/quests?action=toggleStep&id=${stepId}`, 'POST', { today }),
        deleteStep: (stepId: string) => request<{ game: GamePayload }>(`/quests?action=deleteStep&id=${stepId}`, 'POST', {}),
    }
};
