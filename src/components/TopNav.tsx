import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutList, Scroll, Store, User } from 'lucide-react';
import { cn } from '../utils/cn';

const NAV_ITEMS = [
    { to: '/habits', label: 'Hábitos', icon: LayoutList },
    { to: '/misiones', label: 'Misiones', icon: Scroll },
    { to: '/tienda', label: 'Tienda', icon: Store },
    { to: '/personaje', label: 'Personaje', icon: User },
];

const TopNav = () => {
    return (
        <nav className="flex items-center justify-center pt-4 pb-2 px-4 bg-slate-50 dark:bg-[#09090b] md:bg-transparent">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900/50 p-1 rounded-2xl w-full md:w-auto">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            cn(
                                "flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-5 py-2 rounded-xl transition-all font-bold text-sm",
                                isActive
                                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm scale-100"
                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 scale-95"
                            )
                        }
                    >
                        <Icon size={18} strokeWidth={2.5} />
                        <span className="hidden sm:inline">{label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default TopNav;
