import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, Info, CheckCircle2, Calculator, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { useSubjects } from '../../hooks/useSubjects';
import { useTerms } from '../../hooks/useTerms';
import { useSections } from '../../hooks/useSections';
import { useGradebook } from '../../hooks/useGradebook';
import type { Assessment, Student, Grade, Subject } from '../../services/db';
import { calculateStudentGrade } from '../../utils/gradeEngine';

// --- SMART CELL COMPONENT ---
const GradeCell = ({
    studentId,
    assessment,
    initialScore,
    onSave
}: {
    studentId: string,
    assessment: Assessment,
    initialScore?: number,
    onSave: (val: number) => void
}) => {
    const [value, setValue] = useState<string>(initialScore !== undefined ? String(initialScore) : '');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        setValue(initialScore !== undefined ? String(initialScore) : '');
    }, [initialScore]);

    const handleBlur = () => {
        if (value === '') return;
        const numValue = parseFloat(value);

        if (isNaN(numValue) || numValue < 0 || numValue > assessment.maxScore) {
            toast.error(`Invalid score (0-${assessment.maxScore})`);
            setValue(initialScore !== undefined ? String(initialScore) : '');
            return;
        }

        if (numValue !== initialScore) {
            onSave(numValue);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        }
    };

    return (
        <div className="relative w-full h-full flex items-center">
            <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleBlur}
                placeholder="-"
                className="w-full h-full min-w-[70px] p-3 text-center bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 focus:bg-primary-50 dark:focus:bg-primary-900/20 focus:ring-2 focus:ring-inset focus:ring-primary-500 text-slate-900 dark:text-slate-100 font-mono text-sm outline-none transition-colors"
            />
            {isSaved && <CheckCircle2 className="absolute right-1 w-3 h-3 text-emerald-500 animate-in fade-in zoom-in" />}
        </div>
    );
};

// --- MAIN COMPONENT ---
export function Gradebook() {
    const { subjects } = useSubjects();
    const { terms } = useTerms();
    const { sections } = useSections();

    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');

    // Find the full subject object to get weights
    const selectedSubjectData = useMemo(() =>
        subjects.find(s => s.id === selectedSubject),
        [subjects, selectedSubject]);

    const { students, assessments, grades, isLoading, updateGrade } = useGradebook(
        selectedSubject,
        selectedSection,
        selectedTerm
    );

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-10rem)]">

            {/* 1. Filter Bar */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <LayoutGrid className="w-6 h-6 text-primary-600" /> Gradebook Grid
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Real-time weighted K-12 grading.</p>
                </div>

                <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <select
                        value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-slate-200"
                    >
                        <option value="">Select Subject...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>

                    <select
                        value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-slate-200"
                    >
                        <option value="">Select Section...</option>
                        {sections.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>

                    <select
                        value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border-none rounded-xl text-xs font-bold p-2.5 outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-slate-200"
                    >
                        <option value="">Select Quarter...</option>
                        {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
            </header>

            {/* 2. Grid Logic */}
            {!selectedSubject || !selectedSection || !selectedTerm ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <Calculator className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Please select a Subject, Section, and Quarter.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl relative">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-40">
                            <tr>
                                {/* Fixed Left: Student */}
                                <th className="sticky left-0 bg-slate-50 dark:bg-slate-950 p-4 border-b border-r border-slate-200 dark:border-slate-800 w-[240px] z-50">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Student Info</span>
                                </th>

                                {/* Scrollable: Assessments */}
                                {assessments.map(a => (
                                    <th key={a.id} className="p-3 border-b border-r border-slate-200 dark:border-slate-800 w-[110px] text-center bg-white dark:bg-slate-950">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black ${a.category === 'WW' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                                a.category === 'PT' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' :
                                                    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                }`}>
                                                {a.category}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate w-full px-1">{a.title}</span>
                                            <span className="text-[10px] font-mono text-slate-400">/{a.maxScore}</span>
                                        </div>
                                    </th>
                                ))}

                                {/* Fixed Right: Totals */}
                                <th className="sticky right-[180px] bg-slate-100 dark:bg-slate-800 p-4 border-b border-l border-slate-200 dark:border-slate-700 w-[80px] z-50 shadow-[-2px_0_5px_rgba(0,0,0,0.05)]">
                                    <div className="text-center"><p className="text-[9px] font-bold text-slate-400">WW</p><p className="text-[10px] font-black text-primary-600">{selectedSubjectData?.wwWeight! * 100}%</p></div>
                                </th>
                                <th className="sticky right-[100px] bg-slate-100 dark:bg-slate-800 p-4 border-b border-l border-slate-200 dark:border-slate-700 w-[80px] z-50">
                                    <div className="text-center"><p className="text-[9px] font-bold text-slate-400">PT</p><p className="text-[10px] font-black text-primary-600">{selectedSubjectData?.ptWeight! * 100}%</p></div>
                                </th>
                                <th className="sticky right-0 bg-primary-600 p-4 border-b border-l border-primary-500 w-[100px] z-50">
                                    <div className="text-center"><p className="text-[9px] font-bold text-white/70">FINAL</p><p className="text-[10px] font-black text-white">GRADE</p></div>
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {students.map((student) => {
                                const result = calculateStudentGrade(student.id, assessments, grades, selectedSubjectData!);

                                return (
                                    <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="sticky left-0 bg-white dark:bg-slate-900 p-3 border-r border-slate-100 dark:border-slate-800 z-30">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{student.name}</p>
                                            <p className="text-[10px] font-mono text-slate-400">{student.studentNumber}</p>
                                        </td>

                                        {assessments.map(a => (
                                            <td key={a.id} className="p-0 border-r border-slate-100 dark:border-slate-800">
                                                <GradeCell
                                                    studentId={student.id} assessment={a}
                                                    initialScore={grades.find(g => g.studentId === student.id && g.assessmentId === a.id)?.score}
                                                    onSave={(val) => updateGrade(student.id, a.id, val)}
                                                />
                                            </td>
                                        ))}

                                        <td className="sticky right-[180px] bg-slate-50/50 dark:bg-slate-800/30 p-3 text-center border-l border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-500 z-30">
                                            {result.ww.weightedScore.toFixed(2)}
                                        </td>
                                        <td className="sticky right-[100px] bg-slate-50/50 dark:bg-slate-800/30 p-3 text-center border-l border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-500 z-30">
                                            {result.pt.weightedScore.toFixed(2)}
                                        </td>
                                        <td className="sticky right-0 bg-primary-50/50 dark:bg-primary-900/10 p-3 text-center border-l border-primary-100 dark:border-primary-800/50 z-30">
                                            <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                                                {result.finalGrade.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}