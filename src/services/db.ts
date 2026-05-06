import Dexie, { type Table } from 'dexie';

// --- Interfaces ---

export interface AcademicTerm {
    id: string;             // GUID
    year: string;           // e.g., "2025-2026"
    name: string;           // e.g., "1st Quarter"
    startDate: Date;
    endDate: Date;
    isLocked: boolean;      // Kill-switch controlled by Registrar
}

export interface Subject {
    id: string;             // GUID
    code: string;           // e.g., "MATH101"
    title: string;          // e.g., "General Mathematics"
    gradeLevel: number;
    // Standard K-12 Weighting (Must sum to 1.0)
    wwWeight: number;       // Written Works (e.g., 0.30)
    ptWeight: number;       // Performance Tasks (e.g., 0.50)
    qaWeight: number;       // Quarterly Assessment (e.g., 0.20)
}

export interface Student {
    id: string;             // GUID
    studentNumber: string;  // Official School ID / LRN
    name: string;
    gradeLevel: number;
    section: string;
}

export interface Section {
    id: string;         // GUID (e.g., "sec-einstein")
    name: string;       // The display name (e.g., "Einstein")
    gradeLevel: number; // The level (e.g., 7)
}

export type AssessmentCategory = 'WW' | 'PT' | 'QA';

export interface Assessment {
    id: string;
    termId: string;       // Linked to Academic Terms
    subjectId: string;    // Linked to Subject Registry
    title: string;        // e.g., "Quiz #1" or "Unit Project"
    category: AssessmentCategory;
    maxScore: number;
    date: Date;
    weightOverride?: number; // Optional: in case one specific PT is worth more
}

export interface Grade {
    id: string;             // GUID
    studentId: string;      // Relates to Student.id
    assessmentId: string;   // Relates to Assessment.id
    score: number;
}

// Optimization table for Parent/Admin Dashboards
export interface TermSummary {
    id: string;             // GUID
    studentId: string;
    subjectId: string;
    termId: string;
    finalGrade: number;     // The calculated weighted average
}

// --- Database Configuration ---

export class GradingDatabase extends Dexie {
    terms!: Table<AcademicTerm>;
    subjects!: Table<Subject>;
    students!: Table<Student>;
    assessments!: Table<Assessment>;
    grades!: Table<Grade>;
    summaries!: Table<TermSummary>;
    sections!: Table<Section>;

    constructor() {
        super('GradingSystemDB');

        // Schema versioning
        this.version(4).stores({
            terms: 'id, year, isLocked',
            subjects: 'id, code, gradeLevel',
            students: 'id, studentNumber, section, [gradeLevel+section]',
            // Assessments are often queried by subject/term
            assessments: 'id, subjectId, termId, category, [subjectId+termId], [subjectId+termId+category]',
            // Grades are queried heavily by student/assessment combo
            grades: 'id, studentId, assessmentId, [studentId+assessmentId]',
            // Summaries used for reporting
            summaries: 'id, studentId, termId, [studentId+termId], subjectId',
            sections: 'id, name, gradeLevel',
        });

        this.on('populate', (transaction) => {
            console.log('GRID: Initializing database with Jorge\'s seed data...');

            // 1. Academic Terms
            transaction.table('terms').bulkAdd([
                { id: 't-q1', year: '2025-2026', name: '1st Quarter', startDate: new Date('2025-08-01'), endDate: new Date('2025-10-15'), isLocked: false },
                { id: 't-q2', year: '2025-2026', name: '2nd Quarter', startDate: new Date('2025-10-20'), endDate: new Date('2025-12-20'), isLocked: false },
                { id: 't-q3', year: '2025-2026', name: '3rd Quarter', startDate: new Date('2026-01-05'), endDate: new Date('2026-03-20'), isLocked: false },
                { id: 't-q4', year: '2025-2026', name: '4th Quarter', startDate: new Date('2026-03-25'), endDate: new Date('2026-06-05'), isLocked: false },
            ]);

            // 2. Subjects
            transaction.table('subjects').bulkAdd([
                { id: 's-math7', code: 'MATH-7', title: 'General Mathematics', gradeLevel: 7, wwWeight: 0.3, ptWeight: 0.5, qaWeight: 0.2 },
                { id: 's-sci7', code: 'SCI-7', title: 'Integrated Science', gradeLevel: 7, wwWeight: 0.3, ptWeight: 0.5, qaWeight: 0.2 },
                { id: 's-eng7', code: 'ENG-7', title: 'English & Literature', gradeLevel: 7, wwWeight: 0.3, ptWeight: 0.5, qaWeight: 0.2 },
                { id: 's-mapeh7', code: 'MAPEH-7', title: 'Music, Arts, PE & Health', gradeLevel: 7, wwWeight: 0.2, ptWeight: 0.6, qaWeight: 0.2 },
                { id: 's-tle7', code: 'TLE-7', title: 'Technology & Livelihood Education', gradeLevel: 7, wwWeight: 0.2, ptWeight: 0.6, qaWeight: 0.2 },
            ]);

            // 3. Sections
            transaction.table('sections').bulkAdd([
                { id: 'sec-einstein', name: 'Einstein', gradeLevel: 7 },
                { id: 'sec-newton', name: 'Newton', gradeLevel: 7 },
                { id: 'sec-curie', name: 'Curie', gradeLevel: 8 },
            ]);

            // 4. Students
            const testStudents = [
                { name: 'Juan Dela Cruz', section: 'Einstein', lrn: '102938475601' },
                { name: 'Maria Clara Santos', section: 'Einstein', lrn: '102938475602' },
                { name: 'Jose Rizalito', section: 'Einstein', lrn: '102938475603' },
                { name: 'Andres Bonifacio Jr.', section: 'Newton', lrn: '202938475604' },
                { name: 'Gabriela Silang-Reyes', section: 'Newton', lrn: '202938475605' },
                { name: 'Melchora Aquino', section: 'Newton', lrn: '202938475606' },
                { name: 'Emilio Aguinaldo V', section: 'Curie', lrn: '302938475607' },
                { name: 'Leonor Rivera', section: 'Curie', lrn: '302938475608' },
                { name: 'Apolinario Mabini', section: 'Curie', lrn: '302938475609' },
                { name: 'Cory Aquino-Zuzuarregui', section: 'Einstein', lrn: '102938475610' },
            ];

            transaction.table('students').bulkAdd(
                testStudents.map((s) => ({
                    id: `stu-${s.lrn}`, // Use LRN for stable ID
                    studentNumber: s.lrn,
                    name: s.name,
                    gradeLevel: s.section === 'Curie' ? 8 : 7,
                    section: s.section,
                }))
            );

            // assessments
            const sampleAssessments = [
                { termId: 't-q1', subjectId: 's-math7', title: 'Quiz #1', category: 'WW', maxScore: 20, date: new Date('2025-08-15') },
                { termId: 't-q1', subjectId: 's-math7', title: 'Unit Test 1', category: 'PT', maxScore: 100, date: new Date('2025-09-10') },
                { termId: 't-q1', subjectId: 's-math7', title: 'Quarterly Exam', category: 'QA', maxScore: 100, date: new Date('2025-10-10') },
                { termId: 't-q1', subjectId: 's-eng7', title: 'Essay #1', category: 'WW', maxScore: 25, date: new Date('2025-08-20') },
                { termId: 't-q1', subjectId: 's-eng7', title: 'Book Report', category: 'PT', maxScore: 100, date: new Date('2025-09-15') },
                { termId: 't-q1', subjectId: 's-eng7', title: 'Quarterly Exam', category: 'QA', maxScore: 100, date: new Date('2025-10-12') },
            ];

            transaction.table('assessments').bulkAdd(
                sampleAssessments.map((a) => ({
                    id: `assess-${crypto.randomUUID()}`,
                    termId: a.termId,
                    subjectId: a.subjectId,
                    title: a.title,
                    category: a.category,
                    maxScore: a.maxScore,
                    date: a.date,
                }))
            );
        });
    }
}

export const db = new GradingDatabase();