const API_BASE = '/api';

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
    }
};
