import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, ClipboardList, Calendar, Info } from 'lucide-react';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';
import { toast } from 'sonner';

import { useAssessments } from '../../hooks/useAssessments';
import { useSubjects } from '../../hooks/useSubjects';
import { useTerms } from '../../hooks/useTerms';
import { useConfirm } from '../../contexts/ConfirmContext';
import { Drawer } from '../../components/ui/Drawer';
import { DataTable } from '../../components/ui/DataTable';
import type { Assessment, AssessmentCategory } from '../../services/db';

export function Assessments() {
    const [searchParams, setSearchParams] = useSearchParams();
    const confirm = useConfirm();

    // Local filter state
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Data fetching
    const { subjects } = useSubjects();
    const { terms } = useTerms();
    const { assessments, isLoading, refresh, create, update, delete: remove, getById } =
        useAssessments(selectedSubject, selectedTerm);

    // Form State
    const action = searchParams.get('action');
    const targetId = searchParams.get('id');
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '', category: 'WW' as AssessmentCategory, maxScore: 20, date: new Date().toISOString().split('T')[0]
    });

    // Pagination Pipeline
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const filteredData = useMemo(() =>
        assessments.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())),
        [assessments, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        return filteredData.slice(start, start + pagination.pageSize);
    }, [filteredData, pagination]);

    // Sync Form
    useEffect(() => {
        if (action === 'edit' && targetId) {
            getById(targetId).then(a => a && setFormData({
                title: a.title, category: a.category, maxScore: a.maxScore,
                date: new Date(a.date).toISOString().split('T')[0]
            }));
        } else {
            setFormData({ title: '', category: 'WW', maxScore: 20, date: new Date().toISOString().split('T')[0] });
        }
    }, [action, targetId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject || !selectedTerm) return toast.error("Select a Subject and Term first!");

        setIsSaving(true);
        try {
            const payload = { ...formData, date: new Date(formData.date), subjectId: selectedSubject, termId: selectedTerm };
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
                return <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${colors[row.original.category]}`}>{row.original.category}</span>
            }
        },
        { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="font-bold text-slate-900">{row.original.title}</span> },
        { accessorKey: 'maxScore', header: 'Max Score', cell: ({ row }) => <span className="font-mono">{row.original.maxScore} pts</span> },
        {
            id: 'actions',
            cell: ({ row }) => (
                <div className="flex justify-end gap-2 hover-reveal">
                    <button onClick={() => setSearchParams({ action: 'edit', id: row.original.id })} className="p-2 text-slate-400 hover:text-primary-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={async () => {
                        if (await confirm({ title: 'Delete?', description: 'This will delete all student grades for this assessment.', intent: 'danger' })) {
                            await remove(row.original.id); refresh();
                        }
                    }} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        }
    ], [setSearchParams, refresh]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Assessment Registry</h1>
                    <p className="text-sm text-slate-500">Create and manage quizzes, projects, and exams.</p>
                </div>
                <button
                    disabled={!selectedSubject || !selectedTerm}
                    onClick={() => setSearchParams({ action: 'new' })}
                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Add Assessment
                </button>
            </header>

            {/* Ease of Use: Context Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                    <option value="">Select Subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.title} ({s.code})</option>)}
                </select>

                <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-sm p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                    <option value="">Select Quarter...</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name} - {t.year}</option>)}
                </select>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        placeholder="Quick search title..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm outline-none"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {!selectedSubject || !selectedTerm ? (
                <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <Info className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Please select a Subject and Quarter above to view assessments.</p>
                </div>
            ) : (
                <DataTable
                    columns={columns} data={paginatedData} isLoading={isLoading}
                    pageCount={Math.ceil(filteredData.length / pagination.pageSize)}
                    pagination={pagination} setPagination={setPagination}
                />
            )}

            <Drawer isOpen={!!action} onClose={() => setSearchParams({})} title={action === 'new' ? 'New Assessment' : 'Edit Assessment'}>
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Assessment Title</label>
                        <input
                            required value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Unit 1 Quiz"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-primary-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-slate-500">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as AssessmentCategory })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                            >
                                <option value="WW">Written Work</option>
                                <option value="PT">Performance Task</option>
                                <option value="QA">Quarterly Exam</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-slate-500">Max Score</label>
                            <input
                                type="number" required value={formData.maxScore}
                                onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-slate-500">Date Given</label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date" required value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={isSaving} className="w-full bg-primary-600 py-3.5 rounded-2xl text-white font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all">
                        {isSaving ? 'Saving...' : 'Create Assessment'}
                    </button>
                </form>
            </Drawer>
        </div>
    );
}