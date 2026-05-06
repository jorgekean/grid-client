import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, TrendingUp, Target } from 'lucide-react';
import { useStudentPerformance } from '../../hooks/useStudentPerformance';
import { useTerms } from '../../hooks/useTerms';

export function StudentProfile() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { terms } = useTerms();
    const [selectedTerm, setSelectedTerm] = useState('t-q1'); // Default to Q1 seed ID

    const { performances, isLoading } = useStudentPerformance(studentId!, selectedTerm);

    // Calculate General Average
    const generalAverage = performances.length > 0
        ? performances.reduce((sum, p) => sum + p.finalGrade, 0) / performances.length
        : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Actions */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Student Performance</h1>
                        <p className="text-sm text-slate-500">Individual Subject Progress</p>
                    </div>
                </div>

                <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </header>

            {/* 1. Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-primary-600 rounded-3xl text-white shadow-xl shadow-primary-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-primary-100 text-xs font-black uppercase tracking-widest mb-1">General Average</p>
                        <h2 className="text-4xl font-black">{generalAverage.toFixed(2)}%</h2>
                    </div>
                    <Award className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12" />
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Passed Subjects</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">
                            {performances.filter(p => p.finalGrade >= 75).length} / {performances.length}
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Target GPA</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">90.00%</p>
                    </div>
                </div>
            </div>

            {/* 2. Subject Performance List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {performances.map(({ subject, scores, finalGrade }) => (
                    <div
                        key={subject.id}
                        className="group p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-primary-500/50 transition-all"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{subject.title}</h3>
                                    <p className="text-[10px] font-mono text-slate-400">{subject.code}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-lg font-black ${finalGrade >= 75 ? 'text-primary-600' : 'text-red-500'}`}>
                                    {finalGrade.toFixed(2)}%
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Current Rating</p>
                            </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${finalGrade >= 75 ? 'bg-primary-500' : 'bg-red-500'}`}
                                style={{ width: `${finalGrade}%` }}
                            />
                        </div>

                        {/* Category Breakdown */}
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'WW', val: scores.ww, weight: subject.wwWeight },
                                { label: 'PT', val: scores.pt, weight: subject.ptWeight },
                                { label: 'QA', val: scores.qa, weight: subject.qaWeight },
                            ].map(cat => (
                                <div key={cat.label} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cat.label} ({cat.weight * 100}%)</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat.val.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}