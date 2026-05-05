import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Construction, ArrowLeft, LayoutDashboard } from 'lucide-react';

export function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
            {/* Icon with a soft blue pulse */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
                    <Construction className="w-16 h-16 text-primary-600" />
                </div>
            </div>

            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                Under Construction
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                This part of the **GRID** ecosystem is currently being synced or built.
                Please check back later or head back to your dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                </button>

                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/25 hover:bg-primary-700 transition-all active:scale-95"
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Back to Dashboard
                </button>
            </div>

            <div className="mt-12 text-xs font-mono text-slate-400 uppercase tracking-widest">
                GRID Engine v1.0
            </div>
        </div>
    );
}