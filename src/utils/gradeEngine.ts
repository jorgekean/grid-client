// ============================================================================
// 📐 GRADE CALCULATION ENGINE - K-12 Grading System
// ============================================================================
// 
// 🎯 PURPOSE: This file calculates student grades using the DepEd K-12 formula
//
// 📚 HOW IT WORKS (In Simple Terms):
// ---------------------------------------------------------------------------
// 1. Students get scores from different types of activities:
//    • WW (Written Works) - Quizzes, seatwork, homework
//    • PT (Performance Tasks) - Projects, demonstrations, experiments
//    • QA (Quarterly Assessment) - Major exams at end of quarter
//
// 2. Each type has a "weight" (how much it matters in the final grade):
//    • Example: WW might be 30%, PT 50%, QA 20% (must add up to 100%)
//
// 3. The system adds up all scores in each category, calculates the 
//    percentage, then multiplies by the weight.
//
// 4. Final Grade = WW score + PT score + QA score
//
// 💡 EXAMPLE:
//    If a student got 80/100 on WW (worth 30%):
//    → 80÷100 = 0.80 (80%)
//    → 0.80 × 30 = 24 points toward final grade
// ============================================================================

import type { Assessment, Grade, Subject } from '../services/db';

// 📊 Category Summary - Stores the calculation results for one category (WW, PT, or QA)
export interface CategorySummary {
    rawScore: number;       // Total points earned (e.g., 45 out of 50)
    maxScore: number;       // Total possible points (e.g., 50)
    percentage: number;     // Score as a percentage (45/50 = 90%)
    weightedScore: number;  // Contribution to final grade (90% × weight)
}

// 🎓 Student Grade Result - The complete breakdown of a student's grade
export interface StudentGradeResult {
    ww: CategorySummary;    // Written Works breakdown
    pt: CategorySummary;    // Performance Tasks breakdown
    qa: CategorySummary;    // Quarterly Assessment breakdown
    finalGrade: number;     // The final computed grade (sum of weighted scores)
}

// ============================================================================
// 🧮 MAIN CALCULATION FUNCTION - Calculates a student's grade for one subject
// ============================================================================
/**
 * Calculates the final grade for a student in a subject for one quarter.
 * 
 * @param studentId - The unique ID of the student
 * @param assessments - All quizzes, projects, and exams for this subject and quarter
 * @param grades - The student's scores on those assessments
 * @param subject - The subject info (includes the weights for WW, PT, QA)
 * @returns Complete grade breakdown with final grade
 * 
 * 📖 HOW TO READ THE RESULT:
 * - result.ww.rawScore → Total points earned on all Written Works
 * - result.ww.percentage → WW score as a percentage (e.g., 85.5%)
 * - result.ww.weightedScore → How much WW contributes to final grade
 * - result.finalGrade → The final grade (sum of all weighted scores)
 */
export function calculateStudentGrade(
    studentId: string,
    assessments: Assessment[],
    grades: Grade[],
    subject: Subject
): StudentGradeResult {

    // -------------------------------------------------------------------------
    // 📦 HELPER FUNCTION - Calculates stats for one category (WW, PT, or QA)
    // -------------------------------------------------------------------------
    /**
     * This internal function processes one category at a time.
     * It finds all assessments of that type, adds up the scores,
     * and calculates the weighted contribution to the final grade.
     */
    const getCategoryStats = (cat: 'WW' | 'PT' | 'QA', weight: number): CategorySummary => {

        // STEP 1: Find all assessments of this category
        // (e.g., if cat='WW', get all Written Works)
        const catAssessments = assessments.filter(a => a.category === cat);
        const catAssessmentIds = catAssessments.map(a => a.id);

        // STEP 2: Add up all maximum possible scores for this category
        // Example: Quiz 1 (10pts) + Quiz 2 (15pts) = 25pts total possible
        const totalMax = catAssessments.reduce((sum, a) => sum + a.maxScore, 0);

        // STEP 3: Add up all the student's actual scores for this category
        // Example: Student got 8/10 on Quiz 1, 12/15 on Quiz 2 = 20pts earned
        const totalRaw = grades
            .filter(g => g.studentId === studentId && catAssessmentIds.includes(g.assessmentId))
            .reduce((sum, g) => sum + g.score, 0);

        // STEP 4: Calculate percentage (what % of points did they get?)
        // Example: 20 earned / 25 possible = 0.80 = 80%
        const percentage = totalMax > 0 ? totalRaw / totalMax : 0;

        // STEP 5: Return all the calculated values
        return {
            rawScore: totalRaw,                      // Points earned (e.g., 20)
            maxScore: totalMax,                      // Points possible (e.g., 25)
            percentage: percentage * 100,            // Percentage (e.g., 80%)
            weightedScore: percentage * weight * 100,// Contribution to final (e.g., 80% × 30% = 24)
        };
    };

    // -------------------------------------------------------------------------
    // 🎯 CALCULATE EACH CATEGORY
    // -------------------------------------------------------------------------
    // Process Written Works (e.g., weight might be 0.30 for 30%)
    const ww = getCategoryStats('WW', subject.wwWeight);

    // Process Performance Tasks (e.g., weight might be 0.50 for 50%)
    const pt = getCategoryStats('PT', subject.ptWeight);

    // Process Quarterly Assessment (e.g., weight might be 0.20 for 20%)
    const qa = getCategoryStats('QA', subject.qaWeight);

    // -------------------------------------------------------------------------
    // ✅ RETURN THE COMPLETE RESULT
    // -------------------------------------------------------------------------
    // Final Grade is simply the sum of all weighted scores
    // Example: 24 (from WW) + 40 (from PT) + 18 (from QA) = 82 final grade
    return {
        ww,                                                    // Written Works breakdown
        pt,                                                    // Performance Tasks breakdown
        qa,                                                    // Quarterly Assessment breakdown
        finalGrade: ww.weightedScore + pt.weightedScore + qa.weightedScore,  // FINAL GRADE
    };
}