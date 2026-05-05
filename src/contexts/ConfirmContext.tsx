// src/contexts/ConfirmContext.tsx
import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

// 1. Define the options for our modal
interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    intent?: 'danger' | 'primary';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

// 2. The Provider Component
export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);

    // We store the resolver function so we can resolve the Promise when a button is clicked
    const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

    // The function exposed to the app
    const confirm = useCallback((opts: ConfirmOptions) => {
        setOptions(opts);
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            setResolver({ resolve });
        });
    }, []);

    const handleConfirm = () => {
        if (resolver) resolver.resolve(true);
        setIsOpen(false);
    };

    const handleCancel = () => {
        if (resolver) resolver.resolve(false);
        setIsOpen(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* 3. The Modal UI */}
            {isOpen && options && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/40 dark:bg-gray-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                        onClick={handleCancel}
                    />

                    {/* Dialog Card */}
                    <div className="relative w-full max-w-sm bg-[var(--bg-surface)] rounded-2xl shadow-2xl ring-1 ring-gray-200 dark:ring-gray-800 p-6 animate-in zoom-in-95 fade-in duration-200">

                        <div className="flex flex-col items-center text-center">
                            {/* Dynamic Icon based on Intent */}
                            <div className={`p-3 rounded-full mb-4 ${options.intent === 'danger'
                                ? 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500'
                                : 'bg-primary-100 dark:bg-primary-500/10 text-primary-600 dark:text-primary-500'
                                }`}>
                                {options.intent === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
                            </div>

                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {options.title}
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] mb-6">
                                {options.description}
                            </p>
                        </div>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={handleCancel}
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-xl transition-colors"
                            >
                                {options.cancelText || 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] ${options.intent === 'danger'
                                    ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500/20'
                                    : 'bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500/20'
                                    }`}
                            >
                                {options.confirmText || 'Confirm'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

// 4. The Custom Hook
export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) throw new Error('useConfirm must be used within a ConfirmProvider');
    return context.confirm;
};