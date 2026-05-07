import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Settings2 } from 'lucide-react';
import { db, type Student, type Subject } from '../../services/db';
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

export function PrintSF9() {
    const { studentId } = useParams();
    const [student, setStudent] = useState<Student | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [quarterGrades, setQuarterGrades] = useState<QuarterGrades>({});
    const [isLoading, setIsLoading] = useState(true);

    // Masking State
    const [printConfig, setPrintConfig] = useState({
        layout: true, q1: true, q2: false, q3: false, q4: false, final: false,
    });

    // Fetch student data and calculate all quarter grades
    useEffect(() => {
        const loadData = async () => {
            if (!studentId) return;

            setIsLoading(true);
            try {
                // 1. Get student
                const studentData = await db.students.get(studentId);
                if (!studentData) {
                    setIsLoading(false);
                    return;
                }
                setStudent(studentData);

                // 2. Get all subjects for student's grade level
                const subjectsData = await db.subjects
                    .where({ gradeLevel: studentData.gradeLevel })
                    .toArray();
                setSubjects(subjectsData);

                // 3. Get all terms
                const terms = await db.terms.toArray();

                // 4. Calculate grades for each subject across all quarters
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
                            .and(g => g.studentId === studentId)
                            .toArray();

                        // Calculate final grade using grade engine
                        const result = calculateStudentGrade(studentId, assessments, grades, subject);
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
                console.error('Error loading SF9 data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [studentId]);

    if (isLoading || !student) return <div className="p-10 text-center">Loading Report Card...</div>;

    const borderClass = printConfig.layout ? 'border-black' : 'border-slate-300 print:border-transparent';

    return (
        // Force light background, hide scrollbars during print
        <div className="min-h-screen bg-slate-200 py-10 flex justify-center font-serif text-black print:bg-white print:py-0">

            {/* CONTROL PANEL (Hidden on Print) */}
            <div className="fixed top-10 left-10 w-72 bg-white p-6 rounded-2xl shadow-xl border border-slate-200 print:hidden font-sans">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                    <Settings2 className="w-5 h-5 text-primary-600" /> Print Masking
                </h3>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={printConfig.layout} onChange={e => setPrintConfig({ ...printConfig, layout: e.target.checked })} className="w-4 h-4 accent-primary-600" />
                        <span className="text-sm font-bold">Base Layout & Info</span>
                    </label>
                    <hr className="border-slate-100" />
                    {['q1', 'q2', 'q3', 'q4', 'final'].map((key) => (
                        <label key={key} className="flex items-center gap-3 cursor-pointer px-2">
                            <input type="checkbox" checked={(printConfig as any)[key]} onChange={e => setPrintConfig({ ...printConfig, [key]: e.target.checked })} className="w-4 h-4 accent-primary-600" />
                            <span className="text-sm font-medium">Print {key.toUpperCase()}</span>
                        </label>
                    ))}
                </div>
                <button onClick={() => window.print()} className="mt-6 w-full bg-primary-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700">
                    <Printer className="w-5 h-5" /> Execute Print
                </button>
            </div>

            {/* THE A4 PAPER */}
            <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl p-[0.5in] relative print:shadow-none print:w-full print:min-h-0 print:h-auto print:m-0 print:p-[0.5in]">

                {/* DepEd Header */}
                <div className={`text-center space-y-1 mb-8 ${printConfig.layout ? '' : 'opacity-30 print:opacity-0'}`}>
                    <p className="text-xs uppercase tracking-widest">Republic of the Philippines</p>
                    <p className="text-sm font-bold uppercase">Department of Education</p>
                    <p className="text-xs italic">Region IV-A CALABARZON</p>
                    <div className="pt-4">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">Learner's Progress Report Card</h1>
                        <p className="text-sm font-bold">(SF9 / Form 138)</p>
                    </div>
                </div>

                {/* Student Info */}
                <div className={`grid grid-cols-2 gap-y-4 border-y py-6 mb-8 text-sm ${printConfig.layout ? 'border-black' : 'border-slate-300 opacity-30 print:opacity-0 print:border-transparent'}`}>
                    <p><strong>Name:</strong> <span className={`uppercase border-b px-2 ${printConfig.layout ? 'border-black' : 'border-slate-300'}`}>{student.name}</span></p>
                    <p><strong>LRN:</strong> <span className={`border-b px-2 ${printConfig.layout ? 'border-black' : 'border-slate-300'}`}>{student.studentNumber}</span></p>
                    <p><strong>Grade & Section:</strong> <span className={`border-b px-2 ${printConfig.layout ? 'border-black' : 'border-slate-300'}`}>Grade {student.gradeLevel} - {student.section}</span></p>
                </div>

                {/* Grades Table */}
                <table className={`w-full border-collapse border-2 text-xs text-center ${borderClass}`}>
                    <thead className={printConfig.layout ? 'bg-slate-100' : 'bg-slate-100 print:invisible'}>
                        <tr>
                            <th rowSpan={2} className={`border p-2 text-left w-[40%] ${borderClass}`}>Learning Areas</th>
                            <th colSpan={4} className={`border p-2 ${borderClass}`}>Quarterly Rating</th>
                            <th rowSpan={2} className={`border p-2 ${borderClass}`}>Final Rating</th>
                        </tr>
                        <tr>
                            <th className={`border p-1 w-[10%] ${borderClass}`}>1</th><th className={`border p-1 w-[10%] ${borderClass}`}>2</th><th className={`border p-1 w-[10%] ${borderClass}`}>3</th><th className={`border p-1 w-[10%] ${borderClass}`}>4</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map((subject) => {
                            const subjectGrades = quarterGrades[subject.id] || {};

                            return (
                                <tr key={subject.id}>
                                    <td className={`border p-2 text-left font-bold uppercase ${borderClass} ${printConfig.layout ? '' : 'print:invisible'}`}>
                                        {subject.title}
                                    </td>
                                    <td className={`border p-2 font-mono ${borderClass} ${printConfig.q1 ? 'text-black' : 'text-slate-300 print:invisible'}`}>
                                        {subjectGrades.q1 !== undefined ? subjectGrades.q1.toFixed(0) : '--'}
                                    </td>
                                    <td className={`border p-2 font-mono ${borderClass} ${printConfig.q2 ? 'text-black' : 'text-slate-300 print:invisible'}`}>
                                        {subjectGrades.q2 !== undefined ? subjectGrades.q2.toFixed(0) : '--'}
                                    </td>
                                    <td className={`border p-2 font-mono ${borderClass} ${printConfig.q3 ? 'text-black' : 'text-slate-300 print:invisible'}`}>
                                        {subjectGrades.q3 !== undefined ? subjectGrades.q3.toFixed(0) : '--'}
                                    </td>
                                    <td className={`border p-2 font-mono ${borderClass} ${printConfig.q4 ? 'text-black' : 'text-slate-300 print:invisible'}`}>
                                        {subjectGrades.q4 !== undefined ? subjectGrades.q4.toFixed(0) : '--'}
                                    </td>
                                    <td className={`border p-2 font-bold ${borderClass} ${printConfig.final ? 'text-black' : 'text-slate-300 print:invisible'}`}>
                                        {subjectGrades.final !== undefined ? subjectGrades.final.toFixed(0) : '--'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}