import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, GraduationCap, Eye, UserCircle, School } from 'lucide-react';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

import { useStudents } from '../../hooks/useStudents';
import { Drawer } from '../../components/ui/Drawer';
import { DataTable } from '../../components/ui/DataTable';
import type { Student } from '../../services/db';

export function Students() {
    const { students, isLoading, getById } = useStudents();
    const [searchParams, setSearchParams] = useSearchParams();

    // UI State
    const action = searchParams.get('action');
    const targetId = searchParams.get('id');
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    // Selected Student for View Mode
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // --- DATA PIPELINE ---
    const filteredData = useMemo(() => {
        const lower = searchTerm.toLowerCase();
        return students.filter(s =>
            s.name.toLowerCase().includes(lower) ||
            s.studentNumber.toLowerCase().includes(lower) ||
            s.section.toLowerCase().includes(lower)
        );
    }, [students, searchTerm]);

    const paginatedData = useMemo(() => {
        const start = pagination.pageIndex * pagination.pageSize;
        return filteredData.slice(start, start + pagination.pageSize);
    }, [filteredData, pagination]);

    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [searchTerm]);

    // Sync Drawer Data
    useEffect(() => {
        if (action === 'view' && targetId) {
            getById(targetId).then(s => s && setSelectedStudent(s));
        } else {
            setSelectedStudent(null);
        }
    }, [action, targetId]);

    const columns = useMemo<ColumnDef<Student>[]>(() => [
        {
            accessorKey: 'studentNumber',
            header: 'LRN / ID',
            cell: ({ row }) => <span className="font-mono text-xs font-semibold text-slate-500">{row.original.studentNumber}</span>,
        },
        {
            accessorKey: 'name',
            header: 'Full Name',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                        {row.original.name.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{row.original.name}</span>
                </div>
            ),
        },
        {
            header: 'Level & Section',
            cell: ({ row }) => (
                <span className="text-sm">
                    Grade {row.original.gradeLevel} - <span className="text-primary-600 font-medium">{row.original.section}</span>
                </span>
            ),
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <button
                        onClick={() => setSearchParams({ action: 'view', id: row.original.id })}
                        className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ], [setSearchParams]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Roster</h1>
                    <p className="text-sm text-slate-500 mt-1">Total Enrolled: {students.length} students</p>
                </div>
                {/* ADD BUTTON HIDDEN */}
            </header>

            <div className="relative max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                    placeholder="Search by name, LRN, or section..."
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all"
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

            <Drawer
                isOpen={action === 'view'}
                onClose={() => setSearchParams({})}
                title="Student Profile"
            >
                {selectedStudent && (
                    <div className="space-y-8">
                        {/* Profile Header */}
                        <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-black mb-4">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h2>
                            <p className="text-sm font-mono text-slate-500 mt-1">LRN: {selectedStudent.studentNumber}</p>
                        </div>

                        {/* Information Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Grade Level</p>
                                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                                    <GraduationCap className="w-4 h-4 text-primary-500" />
                                    Grade {selectedStudent.gradeLevel}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Section</p>
                                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                                    <School className="w-4 h-4 text-primary-500" />
                                    {selectedStudent.section}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex gap-3 items-start">
                            <UserCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                                This student is synced from the central database. Any changes to their name or LRN must be performed in the School Management System.
                            </p>
                        </div>

                        <button
                            onClick={() => setSearchParams({})}
                            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl active:scale-95 transition-all"
                        >
                            Close Profile
                        </button>
                    </div>
                )}
            </Drawer>
        </div>
    );
}