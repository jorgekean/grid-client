import React, { useState, useEffect } from 'react';
import { Printer, X, Settings2 } from 'lucide-react';
import { db, type Subject } from '../../services/db';
import { calculateStudentGrade } from '../../utils/gradeEngine';

interface QuarterGrades {
    [subjectId: string]: {
        q1?: number;
        q2?: number;
        q3?: number;
        q4?: number;
        final?: number;
    };
}

export function ReportCard({ student, onClose }: { student: any, onClose: () => void }) {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [quarterGrades, setQuarterGrades] = useState<QuarterGrades>({});
    const [isLoading, setIsLoading] = useState(true);

    // --- INCREMENTAL PRINT STATE ---
    // Toggles what actually gets sent to the printer's ink cartridge
    const [printConfig, setPrintConfig] = useState({
        layout: true, // Headers, Borders, Student Info, Subjects
        q1: true,
        q2: false,
        q3: false,
        q4: false,
        final: false,
    });

    // Fetch all quarter grades
    useEffect(() => {
        const loadData = async () => {
            if (!student?.id) return;

            setIsLoading(true);
            try {
                // 1. Get all subjects for student's grade level
                const subjectsData = await db.subjects
                    .where({ gradeLevel: student.gradeLevel })
                    .toArray();
                setSubjects(subjectsData);

                // 2. Get all terms
                const terms = await db.terms.toArray();

                // 3. Calculate grades for each subject across all quarters
                const gradesMap: QuarterGrades = {};

                for (const subject of subjectsData) {
                    gradesMap[subject.id] = {};

                    // For each quarter (Q1-Q4)
                    for (const term of terms) {
                        const quarterKey = term.name.includes('1st') ? 'q1' :
                            term.name.includes('2nd') ? 'q2' :
                                term.name.includes('3rd') ? 'q3' :
                                    term.name.includes('4th') ? 'q4' : null;

                        if (!quarterKey) continue;

                        // Get assessments for this subject and term
                        const assessments = await db.assessments
                            .where({ subjectId: subject.id, termId: term.id })
                            .toArray();

                        if (assessments.length === 0) {
                            gradesMap[subject.id][quarterKey] = undefined;
                            continue;
                        }

                        // Get grades for this student and these assessments
                        const assessmentIds = assessments.map(a => a.id);
                        const grades = await db.grades
                            .where('assessmentId')
                            .anyOf(assessmentIds)
                            .and(g => g.studentId === student.id)
                            .toArray();

                        // Calculate final grade using grade engine
                        const result = calculateStudentGrade(student.id, assessments, grades, subject);
                        gradesMap[subject.id][quarterKey] = result.finalGrade;
                    }

                    // Calculate final grade (average of all quarters with data)
                    const quarterValues = [
                        gradesMap[subject.id].q1,
                        gradesMap[subject.id].q2,
                        gradesMap[subject.id].q3,
                        gradesMap[subject.id].q4
                    ].filter(v => v !== undefined && v > 0) as number[];

                    if (quarterValues.length > 0) {
                        gradesMap[subject.id].final =
                            quarterValues.reduce((sum, v) => sum + v, 0) / quarterValues.length;
                    }
                }

                setQuarterGrades(gradesMap);
            } catch (error) {
                console.error('Error loading Report Card data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [student]);

    const handlePrint = () => {
        window.print();
    };

    // Helper for dynamic table borders during print
    const borderClass = printConfig.layout ? 'border-slate-900 print:border-black' : 'border-slate-300 print:border-transparent';

    return (
        // <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex justify-center overflow-y-auto py-10 print:py-0 print:block print:bg-transparent print:backdrop-blur-none">
        <div className="fixed inset-0 z-[100] bg-slate-900/80 flex justify-center items-start overflow-y-auto py-10 print:static print:bg-transparent print:p-0 print:m-0">
            {/* --- FLOATING CONTROL PANEL (Hidden on Print) --- */}
            <div className="fixed top-6 left-6 z-50 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-72 print:hidden animate-in slide-in-from-left-8">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                    <Settings2 className="w-5 h-5 text-primary-600" /> Print Masking
                </h3>
                <p className="text-xs text-slate-500 mb-6">Select what gets printed. Unchecked items remain on screen for alignment but will not use printer ink.</p>

                <div className="space-y-3">
                    <label className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={printConfig.layout} onChange={e => setPrintConfig({ ...printConfig, layout: e.target.checked })} className="w-4 h-4 accent-primary-600" />
                        <span className="text-sm font-bold">Base Layout & Borders</span>
                    </label>
                    <hr className="border-slate-100 dark:border-slate-700" />
                    <label className="flex items-center gap-3 cursor-pointer px-2">
                        <input type="checkbox" checked={printConfig.q1} onChange={e => setPrintConfig({ ...printConfig, q1: e.target.checked })} className="w-4 h-4 accent-primary-600" />
                        <span className="text-sm font-medium">1st Quarter Grades</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer px-2">
                        <input type="checkbox" checked={printConfig.q2} onChange={e => setPrintConfig({ ...printConfig, q2: e.target.checked })} className="w-4 h-4 accent-primary-600" />
                        <span className="text-sm font-medium">2nd Quarter Grades</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer px-2">
                        <input type="checkbox" checked={printConfig.q3} onChange={e => setPrintConfig({ ...printConfig, q3: e.target.checked })} className="w-4 h-4 accent-primary-600" />
                        <span className="text-sm font-medium">3rd Quarter Grades</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer px-2">
                        <input type="checkbox" checked={printConfig.q4} onChange={e => setPrintConfig({ ...printConfig, q4: e.target.checked })} className="w-4 h-4 accent-primary-600" />
                        <span className="text-sm font-medium">4th Quarter Grades</span>
                    </label>
                    <hr className="border-slate-100 dark:border-slate-700" />
                    <label className="flex items-center gap-3 cursor-pointer px-2">
                        <input type="checkbox" checked={printConfig.final} onChange={e => setPrintConfig({ ...printConfig, final: e.target.checked })} className="w-4 h-4 accent-primary-600" />
                        <span className="text-sm font-bold">Final Rating & Remarks</span>
                    </label>
                </div>
            </div>

            <div className="fixed top-6 right-6 flex gap-3 print:hidden z-50">
                <button onClick={handlePrint} className="bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl hover:bg-primary-700 transition-all active:scale-95">
                    <Printer className="w-5 h-5" /> Execute Print
                </button>
                <button onClick={onClose} className="bg-white p-3 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* --- THE A4 PAPER --- */}
            {/* <div className="a4-print-container bg-white w-[210mm] min-h-[297mm] mx-auto shadow-[0_0_40px_rgba(0,0,0,0.5)] p-[0.5in] text-black font-serif relative print:shadow-none print:w-full"> */}
            <div className="a4-print-container bg-white w-[210mm] h-[295mm] mx-auto shadow-2xl p-[0.5in] text-black font-serif print:shadow-none print:w-full print:min-h-0 print:h-max">
                {/* DepEd Header (Fades out on screen, 0% ink on printer) */}
                <div className={`text-center space-y-1 mb-8 ${printConfig.layout ? '' : 'opacity-30 print:opacity-0'}`}>
                    <p className="text-xs uppercase tracking-widest">Republic of the Philippines</p>
                    <p className="text-sm font-bold uppercase">Department of Education</p>
                    <p className="text-xs italic">Region IV-A CALABARZON</p>
                    <p className="text-xs">Division of Batangas</p>
                    <div className="pt-4">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">Learner's Progress Report Card</h1>
                        <p className="text-sm font-bold">(SF9 / Form 138)</p>
                    </div>
                </div>

                {/* Student Info Grid (Fades out on screen, 0% ink on printer) */}
                <div className={`grid grid-cols-2 gap-y-4 border-y py-6 mb-8 text-sm ${printConfig.layout ? 'border-black' : 'border-slate-300 opacity-30 print:opacity-0 print:border-transparent'}`}>
                    <p><strong>Name:</strong> <span className={`uppercase border-b px-2 ${printConfig.layout ? 'border-black' : 'border-slate-300'}`}>{student.name}</span></p>
                    <p><strong>LRN:</strong> <span className={`border-b px-2 ${printConfig.layout ? 'border-black' : 'border-slate-300'}`}>{student.studentNumber}</span></p>
                    <p><strong>Grade & Section:</strong> <span className={`border-b px-2 ${printConfig.layout ? 'border-black' : 'border-slate-300'}`}>Grade {student.gradeLevel} - {student.section}</span></p>
                    <p><strong>School Year:</strong> <span className={`border-b px-2 ${printConfig.layout ? 'border-black' : 'border-slate-300'}`}>2025-2026</span></p>
                </div>

                {/* The Main Grades Table */}
                <table className={`w-full border-collapse border-2 text-xs text-center ${borderClass}`}>
                    <thead>
                        <tr className={printConfig.layout ? 'bg-slate-100 print:bg-gray-200' : 'bg-slate-100 print:bg-transparent print:text-transparent'}>
                            <th rowSpan={2} className={`border p-2 text-left w-[40%] ${borderClass}`}>Learning Areas</th>
                            <th colSpan={4} className={`border p-2 ${borderClass}`}>Quarterly Rating</th>
                            <th rowSpan={2} className={`border p-2 ${borderClass}`}>Final Rating</th>
                            <th rowSpan={2} className={`border p-2 ${borderClass}`}>Remarks</th>
                        </tr>
                        <tr className={printConfig.layout ? 'bg-slate-100 print:bg-gray-200' : 'bg-slate-100 print:bg-transparent print:text-transparent'}>
                            <th className={`border p-1 w-[10%] ${borderClass}`}>1</th>
                            <th className={`border p-1 w-[10%] ${borderClass}`}>2</th>
                            <th className={`border p-1 w-[10%] ${borderClass}`}>3</th>
                            <th className={`border p-1 w-[10%] ${borderClass}`}>4</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="border p-8 text-center text-slate-500">
                                    Loading grades...
                                </td>
                            </tr>
                        ) : (
                            subjects.map((subject) => {
                                const subjectGrades = quarterGrades[subject.id] || {};
                                const finalGrade = subjectGrades.final;

                                return (
                                    <tr key={subject.id}>
                                        {/* Subject Name (Depends on Layout toggle) */}
                                        <td className={`border p-2 text-left font-bold uppercase ${borderClass} ${printConfig.layout ? '' : 'print:text-transparent'}`}>
                                            {subject.title}
                                        </td>

                                        {/* Q1 Grade */}
                                        <td className={`border p-2 font-mono ${borderClass} ${printConfig.q1 ? 'text-black' : 'text-slate-300 print:text-transparent'}`}>
                                            {subjectGrades.q1 !== undefined ? subjectGrades.q1.toFixed(0) : '--'}
                                        </td>

                                        {/* Q2 Grade */}
                                        <td className={`border p-2 font-mono ${borderClass} ${printConfig.q2 ? 'text-black' : 'text-slate-300 print:text-transparent'}`}>
                                            {subjectGrades.q2 !== undefined ? subjectGrades.q2.toFixed(0) : '--'}
                                        </td>

                                        {/* Q3 Grade */}
                                        <td className={`border p-2 font-mono ${borderClass} ${printConfig.q3 ? 'text-black' : 'text-slate-300 print:text-transparent'}`}>
                                            {subjectGrades.q3 !== undefined ? subjectGrades.q3.toFixed(0) : '--'}
                                        </td>

                                        {/* Q4 Grade */}
                                        <td className={`border p-2 font-mono ${borderClass} ${printConfig.q4 ? 'text-black' : 'text-slate-300 print:text-transparent'}`}>
                                            {subjectGrades.q4 !== undefined ? subjectGrades.q4.toFixed(0) : '--'}
                                        </td>

                                        {/* Final Grade */}
                                        <td className={`border p-2 font-bold ${borderClass} ${printConfig.final ? 'text-black' : 'text-slate-300 print:text-transparent'}`}>
                                            {finalGrade !== undefined ? finalGrade.toFixed(0) : '--'}
                                        </td>

                                        {/* Remarks */}
                                        <td className={`border p-2 font-bold uppercase tracking-tighter ${borderClass} ${printConfig.final ? 'text-black' : 'text-slate-300 print:text-transparent'}`}>
                                            {finalGrade !== undefined && printConfig.final ? (finalGrade >= 75 ? 'Passed' : 'Failed') : '--'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* --- SIGNATURE BLOCKS (Fades out on screen, 0% ink on printer) --- */}
                <div className={`mt-16 text-[11px] ${printConfig.layout ? 'text-black' : 'text-slate-400 opacity-40 print:opacity-0 print:border-transparent'}`}>
                    <div className="grid grid-cols-2 gap-16 px-8">

                        {/* Left Column: Parent Signatures */}
                        <div>
                            <p className="font-bold uppercase mb-4 text-[12px]">Parent / Guardian's Signature</p>
                            <div className="space-y-5">
                                <div className="flex items-end gap-2">
                                    <span className="w-20 font-bold">1st Quarter</span>
                                    <div className={`flex-1 border-b ${printConfig.layout ? 'border-black' : 'border-slate-300 print:border-transparent'}`}></div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="w-20 font-bold">2nd Quarter</span>
                                    <div className={`flex-1 border-b ${printConfig.layout ? 'border-black' : 'border-slate-300 print:border-transparent'}`}></div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="w-20 font-bold">3rd Quarter</span>
                                    <div className={`flex-1 border-b ${printConfig.layout ? 'border-black' : 'border-slate-300 print:border-transparent'}`}></div>
                                </div>
                                <div className="flex items-end gap-2">
                                    <span className="w-20 font-bold">4th Quarter</span>
                                    <div className={`flex-1 border-b ${printConfig.layout ? 'border-black' : 'border-slate-300 print:border-transparent'}`}></div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: School Officials */}
                        <div className="flex flex-col justify-end space-y-10">
                            <div className="text-center">
                                <div className={`w-full border-b mb-1 ${printConfig.layout ? 'border-black' : 'border-slate-300 print:border-transparent'}`}></div>
                                <p className="uppercase font-bold">Class Adviser</p>
                            </div>
                            <div className="text-center">
                                <div className={`w-full border-b mb-1 ${printConfig.layout ? 'border-black' : 'border-slate-300 print:border-transparent'}`}></div>
                                <p className="uppercase font-bold">School Principal</p>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}