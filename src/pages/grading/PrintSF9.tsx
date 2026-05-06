import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Settings2 } from 'lucide-react';
import { db, type Student } from '../../services/db';
import { useStudentPerformance } from '../../hooks/useStudentPerformance';

export function PrintSF9() {
    const { studentId } = useParams();
    const [student, setStudent] = useState<Student | null>(null);

    // Masking State
    const [printConfig, setPrintConfig] = useState({
        layout: true, q1: true, q2: false, q3: false, q4: false, final: false,
    });

    useEffect(() => {
        if (studentId) {
            db.students.get(studentId).then(data => { if (data) setStudent(data); });
        }
    }, [studentId]);

    const { performances, isLoading } = useStudentPerformance(studentId || '', 't-q1');

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
                        {performances.map(({ subject, finalGrade }) => (
                            <tr key={subject.id}>
                                <td className={`border p-2 text-left font-bold uppercase ${borderClass} ${printConfig.layout ? '' : 'print:invisible'}`}>{subject.title}</td>
                                <td className={`border p-2 font-mono ${borderClass} ${printConfig.q1 ? 'text-black' : 'text-slate-300 print:invisible'}`}>{finalGrade.toFixed(0)}</td>
                                <td className={`border p-2 font-mono ${borderClass} ${printConfig.q2 ? 'text-black' : 'text-slate-300 print:invisible'}`}>--</td>
                                <td className={`border p-2 font-mono ${borderClass} ${printConfig.q3 ? 'text-black' : 'text-slate-300 print:invisible'}`}>--</td>
                                <td className={`border p-2 font-mono ${borderClass} ${printConfig.q4 ? 'text-black' : 'text-slate-300 print:invisible'}`}>--</td>
                                <td className={`border p-2 font-bold ${borderClass} ${printConfig.final ? 'text-black' : 'text-slate-300 print:invisible'}`}>--</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}