import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutList, Timer } from 'lucide-react';
import { cn } from '../utils/cn';

const TopNav = () => {
    return (
        <nav className="flex items-center justify-center pt-6 pb-2 bg-slate-50 dark:bg-[#09090b]">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-zinc-900/50 p-1 rounded-2xl">
                <NavLink
                    to="/habits"
                    className={({ isActive }) =>
                        cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold text-sm",
                            isActive
                                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm scale-100"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 scale-95"
                        )
                    }
                >
                    <LayoutList size={18} strokeWidth={2.5} />
                    <span>Hábitos</span>
                </NavLink>

                <NavLink
                    to="/timer"
                    className={({ isActive }) =>
                        cn(
                            "flex items-center gap-2 px-6 py-2 rounded-xl transition-all font-bold text-sm",
                            isActive
                                ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm scale-100"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 scale-95"
                        )
                    }
                >
                    <Timer size={18} strokeWidth={2.5} />
                    <span>Timer</span>
                </NavLink>
            </div>
        </nav>
    );
};

export default TopNav;
