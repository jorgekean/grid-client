import { useState, useEffect } from 'react';
import { Printer, Filter, Eye, Settings2 } from 'lucide-react';
import { db, type Student } from '../../services/db';
import { ReportCard, type PrintConfig } from './ReportCard';

export function BulkPrintSF9() {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedGradeLevel, setSelectedGradeLevel] = useState<number>(7);
    const [sections, setSections] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showReportCards, setShowReportCards] = useState(false);

    // --- CENTRALIZED PRINT CONFIG FOR BULK MODE ---
    // User configures this BEFORE generating
    const [bulkPrintConfig, setBulkPrintConfig] = useState<PrintConfig>({
        layout: true,
        q1: true,
        q2: false,
        q3: false,
        q4: false,
        final: false,
    });

    // Load students and sections
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const allStudents = await db.students.toArray();
                setStudents(allStudents);

                const uniqueSections = [...new Set(allStudents.map(s => s.section))].sort();
                setSections(uniqueSections);

                if (uniqueSections.length > 0) {
                    setSelectedSection(uniqueSections[0]);
                }
            } catch (error) {
                console.error('Error loading students:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const filteredStudents = students.filter(
        s => s.gradeLevel === selectedGradeLevel && s.section === selectedSection
    );

    const handleGenerateReports = () => {
        setShowReportCards(true);
    };

    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 300);
    };

    if (isLoading) {
        return (
            <div className="p-10 text-center">
                <p className="text-slate-600 dark:text-slate-400">Loading students...</p>
            </div>
        );
    }

    return (
        <div className="print-root min-h-screen bg-slate-100 dark:bg-slate-950 print:absolute print:inset-0 print:block print:bg-white print:z-[9999] print:m-0 print:p-0">

            {/* --- SETUP DASHBOARD --- Hidden during print and after generating */}
            {!showReportCards && (
                <div className="print:hidden p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm min-h-screen">
                    <div className="max-w-5xl mx-auto space-y-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Bulk Print SF9 Report Cards
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Select a class and configure your print masking before generating the batch.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* LEFT COLUMN: Class Selection */}
                            <div className="space-y-4 lg:col-span-1">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                        <Filter className="w-5 h-5 text-primary-600" />
                                        Target Class
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Grade Level
                                            </label>
                                            <select
                                                value={selectedGradeLevel}
                                                onChange={(e) => setSelectedGradeLevel(Number(e.target.value))}
                                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                            >
                                                {[7, 8, 9, 10, 11, 12].map(grade => (
                                                    <option key={grade} value={grade}>Grade {grade}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                Section
                                            </label>
                                            <select
                                                value={selectedSection}
                                                onChange={(e) => setSelectedSection(e.target.value)}
                                                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                            >
                                                {sections.map(section => (
                                                    <option key={section} value={section}>{section}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT COLUMN: Print Configuration */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                                        <Settings2 className="w-5 h-5 text-primary-600" />
                                        Print Masking Configuration
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                                        Toggle what gets printed to the physical paper. Unchecked items remain on the digital screen for alignment but will not use printer ink.
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                                            <input type="checkbox" checked={bulkPrintConfig.layout} onChange={e => setBulkPrintConfig({ ...bulkPrintConfig, layout: e.target.checked })} className="w-5 h-5 accent-primary-600 rounded" />
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">Base Layout & Borders</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                                            <input type="checkbox" checked={bulkPrintConfig.final} onChange={e => setBulkPrintConfig({ ...bulkPrintConfig, final: e.target.checked })} className="w-5 h-5 accent-primary-600 rounded" />
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">Final Rating & Remarks</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                                            <input type="checkbox" checked={bulkPrintConfig.q1} onChange={e => setBulkPrintConfig({ ...bulkPrintConfig, q1: e.target.checked })} className="w-5 h-5 accent-primary-600 rounded" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">1st Quarter Grades</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                                            <input type="checkbox" checked={bulkPrintConfig.q2} onChange={e => setBulkPrintConfig({ ...bulkPrintConfig, q2: e.target.checked })} className="w-5 h-5 accent-primary-600 rounded" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">2nd Quarter Grades</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                                            <input type="checkbox" checked={bulkPrintConfig.q3} onChange={e => setBulkPrintConfig({ ...bulkPrintConfig, q3: e.target.checked })} className="w-5 h-5 accent-primary-600 rounded" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">3rd Quarter Grades</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                                            <input type="checkbox" checked={bulkPrintConfig.q4} onChange={e => setBulkPrintConfig({ ...bulkPrintConfig, q4: e.target.checked })} className="w-5 h-5 accent-primary-600 rounded" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">4th Quarter Grades</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* GENERATE BUTTON */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                Ready to format <span className="font-bold text-slate-900 dark:text-white">{filteredStudents.length}</span> students.
                            </p>
                            <button
                                onClick={handleGenerateReports}
                                disabled={filteredStudents.length === 0}
                                className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20"
                            >
                                <Eye className="w-5 h-5" />
                                Generate Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- REPORT CARDS DISPLAY --- */}
            {showReportCards && (
                <div className="bg-slate-100 print:bg-white print:m-0 print:p-0 print:block min-h-screen relative pb-20">

                    {/* ACTION BUTTONS */}
                    <div className="print:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 shadow-sm flex justify-between items-center px-8">
                        <div>
                            <h2 className="font-bold text-slate-900">Print Preview</h2>
                            <p className="text-xs text-slate-500">Grade {selectedGradeLevel} - {selectedSection} • {filteredStudents.length} Cards</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReportCards(false)}
                                className="px-6 py-2.5 bg-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-300 transition-all active:scale-95"
                            >
                                Back to Setup
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95"
                            >
                                <Printer className="w-5 h-5" />
                                Print All
                            </button>
                        </div>
                    </div>

                    <div className="py-10 print:py-0 print:m-0 print:w-full print:block">
                        {filteredStudents.map((student, index) => (
                            <div
                                key={`${student.id}-${index}`}
                                className="print:w-full print:block print:m-0 print:p-0"
                                style={{
                                    pageBreakAfter: 'always',
                                    breakAfter: 'page'
                                }}
                            >
                                <ReportCard
                                    student={student}
                                    onClose={() => { }}
                                    isBulkPrint={true}
                                    overridePrintConfig={bulkPrintConfig}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}