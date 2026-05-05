import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Edit2, Percent, AlertCircle } from 'lucide-react';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { toast } from 'sonner';

import { useSubjects } from '../../hooks/useSubjects';
import { Drawer } from '../../components/ui/Drawer';
import { DataTable } from '../../components/ui/DataTable';
import type { Subject } from '../../services/db';

export function Subjects() {
    const { subjects, isLoading, refresh, update, getById } = useSubjects();
    const [searchParams, setSearchParams] = useSearchParams();

    // URL & UI State
    const action = searchParams.get('action');
    const targetId = searchParams.get('id');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Pagination State
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    // Form State
    const [formData, setFormData] = useState({
        title: '', wwWeight: 30, ptWeight: 50, qaWeight: 20
    });

    // --- DATA PIPELINE ---
    const filteredData = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return subjects.filter(s =>
            s.title.toLowerCase().includes(lower) || s.code.toLowerCase().includes(lower)
        );
    }, [subjects, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        return filteredData.slice(start, start + pagination.pageSize);
    }, [filteredData, pagination]);

    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [searchTerm]);

    const totalWeight = formData.wwWeight + formData.ptWeight + formData.qaWeight;

    // Sync Form
    useEffect(() => {
        if (action === 'edit' && targetId) {
            getById(targetId).then(s => s && setFormData({
                title: s.title,
                wwWeight: s.wwWeight * 100,
                ptWeight: s.ptWeight * 100,
                qaWeight: s.qaWeight * 100
            }));
        }
    }, [action, targetId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (totalWeight !== 100) return toast.error("Total must be 100%");
        setIsSaving(true);
        const toastId = toast.loading('Updating weights...');
        try {
            await update(targetId!, {
                wwWeight: formData.wwWeight / 100,
                ptWeight: formData.ptWeight / 100,
                qaWeight: formData.qaWeight / 100
            });
            toast.success('Weights updated!', { id: toastId });
            await refresh();
            setSearchParams({});
        } catch (err) { toast.error('Failed to update'); }
        finally { setIsSaving(false); }
    };

    const columns = useMemo<ColumnDef<Subject>[]>(() => [
        { accessorKey: 'code', header: 'Code' },
        { accessorKey: 'title', header: 'Subject Title' },
        {
            header: 'Weight Distribution',
            cell: ({ row }) => (
                <div className="flex gap-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono">WW: {row.original.wwWeight * 100}%</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono">PT: {row.original.ptWeight * 100}%</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-mono">QA: {row.original.qaWeight * 100}%</span>
                </div>
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <button onClick={() => setSearchParams({ action: 'edit', id: row.original.id })} className="p-2 text-slate-400 hover:text-primary-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ], [setSearchParams]);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold">Subject Registry</h1>
                <p className="text-sm text-slate-500">Configure grading weights for synced subjects.</p>
            </header>

            <div className="relative max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                    placeholder="Search subjects..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <DataTable
                columns={columns}
                data={paginatedData}
                pageCount={Math.ceil(filteredData.length / pagination.pageSize)}
                pagination={pagination}
                setPagination={setPagination}
                isLoading={isLoading}
            />

            <Drawer isOpen={action === 'edit'} onClose={() => setSearchParams({})} title="Configure Weights">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-2xl border border-primary-100">
                        <h3 className="font-bold flex items-center gap-2"><Percent className="w-4 h-4" /> {formData.title}</h3>
                    </div>

                    <div className="space-y-4">
                        {['wwWeight', 'ptWeight', 'qaWeight'].map((key) => (
                            <div key={key}>
                                <label className="text-xs font-bold uppercase text-slate-500">{key === 'wwWeight' ? 'Written Works' : key === 'ptWeight' ? 'Performance Tasks' : 'Quarterly Assessment'}</label>
                                <div className="relative mt-1">
                                    <input
                                        type="number"
                                        value={formData[key as keyof typeof formData]}
                                        onChange={(e) => setFormData({ ...formData, [key]: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary-500"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={`p-4 rounded-2xl border flex items-center gap-3 ${totalWeight === 100 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-bold">Current Total: {totalWeight}%</span>
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full bg-primary-600 py-3 rounded-xl text-white font-bold disabled:opacity-50 transition-all">
                        {isSaving ? 'Updating...' : 'Save Configuration'}
                    </button>
                </form>
            </Drawer>
        </div>
    );
}