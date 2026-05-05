// src/components/layout/AppLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

export function AppLayout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--bg-base)] flex p-3 sm:p-4 gap-4 font-sans text-[var(--text-base)]">

            <Sidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 gap-4">
                <TopHeader onOpenSidebar={() => setIsMobileMenuOpen(true)} />

                {/* Main Page Content Canvas */}
                <main className="flex-1 bg-[var(--bg-surface)] rounded-2xl shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-800 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {/* Outlet is where React Router injects our page components like Dashboard.tsx */}
                    <Outlet />
                </main>
            </div>

        </div>
    );
}