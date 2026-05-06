// src/utils/gradingEngine.ts
import type { Assessment, Grade, Subject } from '../services/db';

export interface CategorySummary {
    rawScore: number;
    maxScore: number;
    percentage: number; // rawScore / maxScore
    weightedScore: number; // percentage * weight
}

export interface StudentGradeResult {
    ww: CategorySummary;
    pt: CategorySummary;
    qa: CategorySummary;
    finalGrade: number;
}

export function calculateStudentGrade(
    studentId: string,
    assessments: Assessment[],
    grades: Grade[],
    subject: Subject
): StudentGradeResult {
    const getCategoryStats = (cat: 'WW' | 'PT' | 'QA', weight: number): CategorySummary => {
        const catAssessments = assessments.filter(a => a.category === cat);
        const catAssessmentIds = catAssessments.map(a => a.id);

        // Sum of max scores and sum of student scores
        const totalMax = catAssessments.reduce((sum, a) => sum + a.maxScore, 0);
        const totalRaw = grades
            .filter(g => g.studentId === studentId && catAssessmentIds.includes(g.assessmentId))
            .reduce((sum, g) => sum + g.score, 0);

        const percentage = totalMax > 0 ? totalRaw / totalMax : 0;

        return {
            rawScore: totalRaw,
            maxScore: totalMax,
            percentage: percentage * 100,
            weightedScore: percentage * weight * 100,
        };
    };

    const ww = getCategoryStats('WW', subject.wwWeight);
    const pt = getCategoryStats('PT', subject.ptWeight);
    const qa = getCategoryStats('QA', subject.qaWeight);

    return {
        ww,
        pt,
        qa,
        finalGrade: ww.weightedScore + pt.weightedScore + qa.weightedScore,
    };
}