import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, CalendarDays, Search, Lock, Unlock } from 'lucide-react';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { toast } from 'sonner';

import { useTerms } from '../../hooks/useTerms';
import { useConfirm } from '../../contexts/ConfirmContext';
import { Drawer } from '../../components/ui/Drawer';
import { DataTable } from '../../components/ui/DataTable';
import { type AcademicTerm } from '../../services/db';

export function AcademicTerms() {
    const { terms, isLoading, create, update, remove, getById, refresh } = useTerms();
    const confirm = useConfirm();
    const [searchParams, setSearchParams] = useSearchParams();

    // URL State
    const action = searchParams.get('action');
    const targetId = searchParams.get('id');

    // Form State
    const [formData, setFormData] = useState({
        year: '2025-2026',
        name: '',
        startDate: '',
        endDate: '',
        isLocked: false,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    // Filter & Pagination Pipeline
    const filteredData = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return terms.filter(t =>
            t.name.toLowerCase().includes(lower) || t.year.includes(lower)
        );
    }, [terms, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        return filteredData.slice(start, start + pagination.pageSize);
    }, [filteredData, pagination]);

    // Sync Form with Edit State
    useEffect(() => {
        if (action === 'edit' && targetId) {
            getById(targetId).then(term => {
                if (term) {
                    setFormData({
                        year: term.year,
                        name: term.name,
                        startDate: new Date(term.startDate).toISOString().split('T')[0],
                        endDate: new Date(term.endDate).toISOString().split('T')[0],
                        isLocked: term.isLocked
                    });
                }
            });
        } else {
            setFormData({ year: '2025-2026', name: '', startDate: '', endDate: '', isLocked: false });
        }
    }, [action, targetId]);

    const closeDrawer = () => setSearchParams({});

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const toastId = toast.loading('Saving academic term...');

        try {
            const payload = {
                ...formData,
                startDate: new Date(formData.startDate),
                endDate: new Date(formData.endDate),
            };

            if (action === 'new') {
                await create(payload);
                toast.success(`${formData.name} created!`, { id: toastId });
            } else if (action === 'edit' && targetId) {
                await update(targetId, payload);
                toast.success(`Term updated!`, { id: toastId });
            }
            closeDrawer();
        } catch (error) {
            toast.error('Failed to save term.', { id: toastId });
        } finally {
            setIsSaving(false);
        }

        await refresh();
    };

    const handleDelete = async (id: string, name: string) => {
        const isConfirmed = await confirm({
            title: 'Delete Term',
            description: `Are you sure you want to delete ${name}? This will remove all associated assessments.`,
            confirmText: 'Delete',
            intent: 'danger',
        });

        if (isConfirmed) {
            await remove(id);
            toast.success('Term deleted successfully.');
        }

        await refresh();
    };

    const columns = useMemo<ColumnDef<AcademicTerm>[]>(() => [
        {
            accessorKey: 'year',
            header: 'Academic Year',
            cell: ({ row }) => <span className="font-medium text-gray-900 dark:text-gray-200">{row.original.year}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Term Name',
            cell: ({ row }) => <span className="font-semibold text-primary-600">{row.original.name}</span>,
        },
        {
            accessorKey: 'isLocked',
            header: 'Status',
            cell: ({ row }) => (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${row.original.isLocked ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                    {row.original.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {row.original.isLocked ? 'Locked' : 'Active'}
                </div>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex items-center justify-end gap-2 hover-reveal">
                    <button onClick={() => setSearchParams({ action: 'edit', id: row.original.id })} className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(row.original.id, row.original.name)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ], []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Terms</h1>
                    <p className="text-sm text-[var(--text-muted)] mt-1">Manage grading periods and year settings.</p>
                </div>
                <button
                    onClick={() => setSearchParams({ action: 'new' })}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
                >
                    <Plus className="w-4 h-4" /> Add Term
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative group max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary-500" />
                <input
                    type="text"
                    placeholder="Search quarters or years..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-[var(--bg-surface)] border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
            </div>

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={paginatedData}
                pageCount={Math.ceil(filteredData.length / pagination.pageSize)}
                pagination={pagination}
                setPagination={setPagination}
                isLoading={isLoading}
            />

            {/* Slide-over Drawer */}
            <Drawer
                isOpen={!!action}
                onClose={closeDrawer}
                title={action === 'new' ? 'Initialize New Term' : 'Configure Term'}
            >
                <form onSubmit={handleSave} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Academic Year</label>
                            <input
                                type="text"
                                required
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:border-primary-500 outline-none"
                                placeholder="2025-2026"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Term Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:border-primary-500 outline-none"
                                placeholder="e.g. 1st Quarter"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Start Date</label>
                            <input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">End Date</label>
                            <input
                                type="date"
                                required
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all">
                        <div className="flex flex-col gap-0.5">
                            <label htmlFor="isLocked" className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {formData.isLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
                                Lock Academic Term
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
                                Prevents further grade modifications by teachers once enabled.
                            </p>
                        </div>

                        {/* Modern Switch Component */}
                        <button
                            type="button"
                            role="switch"
                            aria-checked={formData.isLocked}
                            onClick={() => setFormData({ ...formData, isLocked: !formData.isLocked })}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${formData.isLocked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${formData.isLocked ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button type="button" onClick={closeDrawer} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-primary-700 transition-all">
                            {isSaving ? 'Saving...' : 'Save Term'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    );
}