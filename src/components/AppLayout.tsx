import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

const AppLayout = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 pb-32 transition-colors duration-200">
            <main className="w-full max-w-md md:max-w-5xl mx-auto min-h-screen bg-white dark:bg-[#09090b] md:bg-transparent dark:md:bg-transparent shadow-2xl md:shadow-none overflow-hidden relative md:mt-6">
                <TopNav />
                {/* Mobile: Tight centered card. Desktop: Wide container (transparent bg to blend or distinct) */}
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;
