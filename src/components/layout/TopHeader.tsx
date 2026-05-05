import React from 'react';
import { Menu, Search, Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface TopHeaderProps {
    onOpenSidebar: () => void;
}

export function TopHeader({ onOpenSidebar }: TopHeaderProps) {
    // Pull our theme state and setter from the Context
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        // If it's light (or system and system is light), switch to dark, and vice versa.
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('light');
        } else {
            // If it's set to 'system', figure out what system is currently using, then flip it.
            const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(isSystemDark ? 'light' : 'dark');
        }
    };

    return (
        <header className="h-16 bg-[var(--bg-surface)]/80 backdrop-blur-md rounded-2xl shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-800 flex items-center justify-between px-4 sm:px-6 z-40">
            <div className="flex items-center flex-1">
                <button
                    className="xl:hidden mr-4 p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={onOpenSidebar}
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="max-w-md w-full hidden sm:block relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search property number..."
                        className="block w-full pl-10 pr-3 py-2 bg-gray-50/50 dark:bg-gray-900/50 border-none rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-[var(--bg-surface)] transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-5">
                {/* Dark Mode Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Toggle Dark Mode"
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5" />
                    ) : (
                        <Moon className="w-5 h-5" />
                    )}
                </button>

                <button className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--bg-surface)]"></span>
                </button>

                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold shadow-sm cursor-pointer ring-2 ring-transparent hover:ring-primary-500/30 transition-all">
                    J
                </div>
            </div>
        </header>
    );
}