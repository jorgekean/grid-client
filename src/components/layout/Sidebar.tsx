import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarDays,
    BookOpen,
    GraduationCap,
    Users,
    Table2,
    ClipboardList,
    BarChart3,
    ShieldCheck,
    Settings,
    UserCircle,
    Package,
    Sparkles,
    X
} from 'lucide-react';

// 1. Explicitly define our props so TypeScript is happy
interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

// 2. Our grouped navigation structure (Phase 1 Refined)
const navGroups = [
    {
        title: 'Core',
        links: [
            { name: 'Dashboard', path: '/', icon: LayoutDashboard },
            { name: 'My Profile', path: '/profile', icon: UserCircle },
        ]
    },
    {
        title: 'Academic Control', // Merged Setup & Roster for a tighter flow
        links: [
            { name: 'Academic Terms', path: '/terms', icon: CalendarDays },
            { name: 'Subject Registry', path: '/subjects', icon: BookOpen },
            { name: 'Student Roster', path: '/students', icon: GraduationCap },
        ]
    },
    {
        title: 'Grading Engine', // The "Workhorse" of the app
        links: [
            { name: 'Class Gradebook', path: '/gradebook', icon: Table2 },
            { name: 'Assessments', path: '/assessments', icon: ClipboardList },
        ]
    },
    {
        title: 'Monitoring',
        links: [
            { name: 'Performance', path: '/performance', icon: BarChart3 },
            { name: 'Audit Logs', path: '/audit', icon: ShieldCheck },
            { name: 'Settings', path: '/settings', icon: Settings },
        ]
    }
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    return (
        <aside className={`
      fixed inset-y-4 left-4 z-50 w-64 bg-[var(--bg-surface)] rounded-2xl shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-800 flex flex-col transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'}
      xl:relative xl:translate-x-0 xl:inset-y-0 xl:left-0
    `}>
            {/* Sidebar Header / Logo */}
            <div className="flex items-center justify-between h-20 px-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-md shadow-primary-500/20">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">GRID</span>
                </div>
                <button
                    className="xl:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
                {navGroups.map((group) => (
                    <div key={group.title} className="space-y-1.5">
                        <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                            {group.title}
                        </h3>

                        {group.links.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    onClick={onClose}
                                    className={({ isActive }) => `
                    group flex items-center px-3 py-2.5 rounded-xl font-medium transition-all duration-200
                    ${isActive
                                            ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                                        }
                  `}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <Icon className={`w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                                            {link.name}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Upgrade / Status Card */}
            <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-800/20 ring-1 ring-gray-200/50 dark:ring-gray-700/50 text-center">
                <Sparkles className="w-5 h-5 mx-auto mb-2 text-primary-500" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">GRID is up to date</p>
                <p className="text-[10px] text-gray-400 mt-1">Version 1.0.0</p>
            </div>
        </aside>
    );
}