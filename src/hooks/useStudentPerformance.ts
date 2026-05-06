import { useState, useEffect, useCallback } from 'react';
import { db, type Subject, type Assessment, type Grade } from '../services/db';

export function useStudentPerformance(studentId: string, termId: string) {
    const [performances, setPerformances] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const calculateAllSubjects = useCallback(async () => {
        if (!studentId || !termId) return;
        setIsLoading(true);

        try {
            const student = await db.students.get(studentId);
            if (!student) return;

            // Get all subjects for the student's grade level
            const allSubjects = await db.subjects.where({ gradeLevel: student.gradeLevel }).toArray();

            const results = await Promise.all(allSubjects.map(async (subject) => {
                // Fetch assessments for THIS subject and THIS term
                const assessments = await db.assessments
                    .where({ subjectId: subject.id, termId })
                    .toArray();

                const assessmentIds = assessments.map(a => a.id);
                const grades = await db.grades
                    .where('assessmentId')
                    .anyOf(assessmentIds)
                    .and(g => g.studentId === studentId)
                    .toArray();

                // Use our Math Logic
                const getCatScore = (cat: 'WW' | 'PT' | 'QA', weight: number) => {
                    const catAsm = assessments.filter(a => a.category === cat);
                    const totalMax = catAsm.reduce((sum, a) => sum + a.maxScore, 0);
                    const totalRaw = grades
                        .filter(g => catAsm.find(a => a.id === g.assessmentId))
                        .reduce((sum, g) => sum + g.score, 0);

                    return totalMax > 0 ? (totalRaw / totalMax) * weight * 100 : 0;
                };

                const ww = getCatScore('WW', subject.wwWeight);
                const pt = getCatScore('PT', subject.ptWeight);
                const qa = getCatScore('QA', subject.qaWeight);
                const final = ww + pt + qa;

                return {
                    subject,
                    scores: { ww, pt, qa },
                    finalGrade: final
                };
            }));

            setPerformances(results);
        } finally {
            setIsLoading(false);
        }
    }, [studentId, termId]);

    useEffect(() => { calculateAllSubjects(); }, [calculateAllSubjects]);

    return { performances, isLoading, refresh: calculateAllSubjects };
}