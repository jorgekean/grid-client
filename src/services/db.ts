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
        this.version(7).stores({
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
            const subjectData = [
                { id: 's-math7', code: 'MATH-7', title: 'General Mathematics', gradeLevel: 7, wwWeight: 0.3, ptWeight: 0.5, qaWeight: 0.2 },
                { id: 's-sci7', code: 'SCI-7', title: 'Integrated Science', gradeLevel: 7, wwWeight: 0.3, ptWeight: 0.5, qaWeight: 0.2 },
                { id: 's-eng7', code: 'ENG-7', title: 'English & Literature', gradeLevel: 7, wwWeight: 0.3, ptWeight: 0.5, qaWeight: 0.2 },
                { id: 's-mapeh7', code: 'MAPEH-7', title: 'Music, Arts, PE & Health', gradeLevel: 7, wwWeight: 0.2, ptWeight: 0.6, qaWeight: 0.2 },
                { id: 's-tle7', code: 'TLE-7', title: 'Technology & Livelihood Education', gradeLevel: 7, wwWeight: 0.2, ptWeight: 0.6, qaWeight: 0.2 },
            ];
            transaction.table('subjects').bulkAdd(subjectData);

            // 3. Sections
            transaction.table('sections').bulkAdd([
                { id: 'sec-einstein', name: 'Einstein', gradeLevel: 7 },
                { id: 'sec-newton', name: 'Newton', gradeLevel: 7 },
                { id: 'sec-curie', name: 'Curie', gradeLevel: 8 },
            ]);

            // 4. Students (Full Roster)
            const juanId = 'stu-102938475601';
            const joseId = 'stu-102938475603';
            const emilioId = 'stu-302938475607';

            transaction.table('students').bulkAdd([
                { id: juanId, studentNumber: '102938475601', name: 'Juan Dela Cruz', gradeLevel: 7, section: 'Einstein' },
                { id: 'stu-102938475602', studentNumber: '102938475602', name: 'Maria Clara Santos', gradeLevel: 7, section: 'Einstein' },
                { id: joseId, studentNumber: '102938475603', name: 'Jose Rizalito', gradeLevel: 7, section: 'Einstein' },
                { id: 'stu-202938475604', studentNumber: '202938475604', name: 'Andres Bonifacio Jr.', gradeLevel: 7, section: 'Newton' },
                { id: 'stu-202938475605', studentNumber: '202938475605', name: 'Gabriela Silang-Reyes', gradeLevel: 7, section: 'Newton' },
                { id: emilioId, studentNumber: '302938475607', name: 'Emilio Aguinaldo V', gradeLevel: 8, section: 'Curie' },
                { id: 'stu-102938475610', studentNumber: '102938475610', name: 'Cory Aquino-Zuzuarregui', gradeLevel: 7, section: 'Einstein' },
            ]);

            // 5. THE DATA ENGINE: Assessments & Grades for Juan
            const assessments: Assessment[] = [];
            const grades: Grade[] = [];

            subjectData.forEach(sub => {
                // Create one of each category for every subject for Q1
                const categories: AssessmentCategory[] = ['WW', 'PT', 'QA'];

                categories.forEach(cat => {
                    const assessId = `seed-${sub.code}-${cat}`;
                    const max = cat === 'WW' ? 20 : 100;

                    assessments.push({
                        id: assessId,
                        termId: 't-q4',
                        subjectId: sub.id,
                        title: cat === 'WW' ? 'Unit Quiz' : cat === 'PT' ? 'Major Project' : 'Quarterly Exam',
                        category: cat,
                        maxScore: max,
                        date: new Date('2025-09-15')
                    });

                    // --- JUAN: High Performer ---
                    grades.push({ id: `g-juan-${assessId}`, studentId: juanId, assessmentId: assessId, score: cat === 'WW' ? 19 : 95 });

                    // --- JOSE: Fails Math, Passes others ---
                    let joseScore = cat === 'WW' ? 15 : 85; // Passing default
                    if (sub.code === 'MATH-7') joseScore = cat === 'WW' ? 8 : 50; // Failing Math (approx 45%)
                    grades.push({ id: `g-jose-${assessId}`, studentId: joseId, assessmentId: assessId, score: joseScore });

                    // --- EMILIO: Fails all except English ---
                    let emilioScore = cat === 'WW' ? 6 : 45; // Failing default
                    if (sub.code === 'ENG-7') emilioScore = cat === 'WW' ? 18 : 90; // Passing English
                    grades.push({ id: `g-emilio-${assessId}`, studentId: emilioId, assessmentId: assessId, score: emilioScore });
                });
            });

            transaction.table('assessments').bulkAdd(assessments);
            transaction.table('grades').bulkAdd(grades);
        });
    }
}

export const db = new GradingDatabase();