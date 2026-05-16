import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Calendar, BookOpen, Layers } from 'lucide-react';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { toast } from 'sonner';

import { useAssessments } from '../../hooks/useAssessments';
import { useSubjects } from '../../hooks/useSubjects';
import { useTerms } from '../../hooks/useTerms';
import { useConfirm } from '../../contexts/ConfirmContext';
import { Drawer } from '../../components/ui/Drawer';
import { DataTable } from '../../components/ui/DataTable';
import type { Assessment, AssessmentCategory } from '../../services/db';
import { PrintBubbleSheet } from './PrintBubbleSheet';
import { OMRScanner } from '../../components/omr/OMRScanner';
import { BubbleSheetDocument } from '../../components/omr/BubbleSheetDocument';
import { OMRTemplateGenerator } from '../../components/omr/OMRTemplate';

export function Assessments() {
    const [searchParams, setSearchParams] = useSearchParams();
    const confirm = useConfirm();

    // Data fetching (No filters passed to hook now)
    const { subjects } = useSubjects();
    const { terms } = useTerms();
    const { assessments, isLoading, refresh, create, update, delete: remove, getById } = useAssessments();

    // URL & UI State
    const action = searchParams.get('action');
    const targetId = searchParams.get('id');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        category: 'WW' as AssessmentCategory,
        maxScore: 20,
        date: new Date().toISOString().split('T')[0],
        subjectId: '',
        termId: ''
    });

    // Pagination Pipeline
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

    const filteredData = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return assessments.filter(a => {
            const subject = subjects.find(s => s.id === a.subjectId)?.title.toLowerCase() || '';
            return a.title.toLowerCase().includes(lower) || subject.includes(lower);
        });
    }, [assessments, searchTerm, subjects]);

    const paginatedData = useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        return filteredData.slice(start, start + pagination.pageSize);
    }, [filteredData, pagination]);

    // Sync Form for Edit
    useEffect(() => {
        if (action === 'edit' && targetId) {
            getById(targetId).then(a => a && setFormData({
                title: a.title,
                category: a.category,
                maxScore: a.maxScore,
                date: new Date(a.date).toISOString().split('T')[0],
                subjectId: a.subjectId,
                termId: a.termId
            }));
        } else {
            setFormData({
                title: '', category: 'WW', maxScore: 20,
                date: new Date().toISOString().split('T')[0],
                subjectId: '', termId: ''
            });
        }
    }, [action, targetId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subjectId || !formData.termId) return toast.error("Please assign a Subject and Quarter.");

        setIsSaving(true);
        try {
            const payload = { ...formData, date: new Date(formData.date) };
            action === 'new' ? await create(payload) : await update(targetId!, payload);
            toast.success('Assessment saved');
            await refresh();
            setSearchParams({});
        } catch { toast.error('Save failed'); }
        finally { setIsSaving(false); }
    };

    const columns = useMemo<ColumnDef<Assessment>[]>(() => [
        {
            accessorKey: 'category',
            header: 'Type',
            cell: ({ row }) => {
                const colors = { WW: 'bg-blue-100 text-blue-700', PT: 'bg-indigo-100 text-indigo-700', QA: 'bg-purple-100 text-purple-700' };
                return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors[row.original.category]}`}>{row.original.category}</span>
            }
        },
        {
            header: 'Context',
            cell: ({ row }) => {
                const subj = subjects.find(s => s.id === row.original.subjectId);
                const term = terms.find(t => t.id === row.original.termId);
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-amber-50">{subj?.title || 'Unknown'}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tight">{term?.name} • {term?.year}</span>
                    </div>
                );
            }
        },
        { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="font-medium text-slate-700 dark:text-amber-50">{row.original.title}</span> },
        { accessorKey: 'maxScore', header: 'Max', cell: ({ row }) => <span className="font-mono text-xs">{row.original.maxScore} pts</span> },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="flex justify-end gap-2 hover-reveal">
                    <button onClick={() => setSearchParams({ action: 'edit', id: row.original.id })} className="p-2 text-slate-400 dark:text-amber-50 hover:text-primary-600 transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={async () => {
                        if (await confirm({ title: 'Delete Assessment?', description: 'This will wipe all related student scores.', intent: 'danger' })) {
                            await remove(row.original.id); await refresh();
                        }
                    }} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ], [subjects, terms, setSearchParams, refresh]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* <PrintBubbleSheet /> */}
            <OMRTemplateGenerator />
            <OMRScanner />
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Assessment Registry</h1>
                    <p className="text-sm text-slate-500">Master list of all class tasks and exams.</p>
                </div>
                <button
                    onClick={() => setSearchParams({ action: 'new' })}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                >
                    <Plus className="w-4 h-4" /> Add Assessment
                </button>
            </header>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    placeholder="Search by title or subject..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <DataTable
                columns={columns}
                data={paginatedData}
                isLoading={isLoading}
                pageCount={Math.ceil(filteredData.length / pagination.pageSize)}
                pagination={pagination}
                setPagination={setPagination}
            />

            <Drawer
                isOpen={!!action}
                onClose={() => setSearchParams({})}
                title={action === 'new' ? 'New Assessment' : 'Edit Assessment'}
            >
                {/* Inside your Drawer component */}
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Context Header: Uses a subtle blue tint in dark mode */}
                    <div className="p-4 bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50 rounded-2xl">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-primary-600 dark:text-primary-400 tracking-widest flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" /> Subject
                                </label>
                                <select
                                    required
                                    value={formData.subjectId}
                                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500/20"
                                >
                                    <option value="">Choose Subject...</option>
                                    {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-primary-600 dark:text-primary-400 tracking-widest flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> Quarter
                                </label>
                                <select
                                    required
                                    value={formData.termId}
                                    onChange={(e) => setFormData({ ...formData, termId: e.target.value })}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500/20"
                                >
                                    <option value="">Choose...</option>
                                    {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Main Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Assessment Title</label>
                            <input
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Unit 1 Quiz"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-primary-500 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AssessmentCategory })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none"
                                >
                                    <option value="WW">Written Work</option>
                                    <option value="PT">Performance Task</option>
                                    <option value="QA">Quarterly Exam</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Max Score</label>
                                <input
                                    type="number"
                                    value={formData.maxScore}
                                    onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Date Given</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none color-scheme-dark"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setSearchParams({})}
                            className="flex-1 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-primary-600 py-3.5 rounded-2xl text-white text-sm font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-500 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSaving ? 'Syncing...' : 'Save Assessment'}
                        </button>
                    </div>
                </form>
            </Drawer>
        </div>
    );
}