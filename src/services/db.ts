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

export interface Assessment {
    id: string;             // GUID
    subjectId: string;      // Relates to Subject.id
    termId: string;         // Relates to AcademicTerm.id
    type: 'WW' | 'PT' | 'QA';
    title: string;          // e.g., "Quiz #1" or "Periodical Exam"
    maxScore: number;
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

    constructor() {
        super('GradingSystemDB');

        // Schema versioning
        this.version(1).stores({
            terms: 'id, year, isLocked',
            subjects: 'id, code, gradeLevel',
            students: 'id, studentNumber, [gradeLevel+section]',
            // Assessments are often queried by subject/term
            assessments: 'id, subjectId, termId, [subjectId+termId]',
            // Grades are queried heavily by student/assessment combo
            grades: 'id, studentId, assessmentId, [studentId+assessmentId]',
            // Summaries used for reporting
            summaries: 'id, studentId, termId, [studentId+termId], subjectId'
        });
    }
}

export const db = new GradingDatabase();