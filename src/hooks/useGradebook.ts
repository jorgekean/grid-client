import { useState, useEffect, useCallback } from 'react';
import { db, type Student, type Assessment, type Grade } from '../services/db';

export function useGradebook(subjectId: string, section: string, termId: string) {
    const [students, setStudents] = useState<Student[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!subjectId || !section || !termId) return;
        setIsLoading(true);

        try {
            // 1. Fetch Students in the Section
            const studentData = await db.students.where({ section }).toArray();

            // 2. Fetch Assessments for this Subject/Term
            const assessmentData = await db.assessments
                .where({ subjectId, termId })
                .sortBy('date');

            console.log("Fetched Assessments:", assessmentData);
            // 3. Fetch all existing grades for these assessments
            const assessmentIds = assessmentData.map(a => a.id);
            const gradeData = await db.grades
                .where('assessmentId')
                .anyOf(assessmentIds)
                .toArray();

            setStudents(studentData);
            setAssessments(assessmentData);
            setGrades(gradeData);
        } finally {
            setIsLoading(false);
        }
    }, [subjectId, section, termId]);

    useEffect(() => { loadData(); }, [loadData]);

    const updateGrade = async (studentId: string, assessmentId: string, score: number) => {
        const id = `${studentId}-${assessmentId}`; // Consistent ID for bulkPut
        await db.grades.put({ id, studentId, assessmentId, score });
        // Silently update local state for instant UI feedback
        setGrades(prev => {
            const filtered = prev.filter(g => g.id !== id);
            return [...filtered, { id, studentId, assessmentId, score }];
        });
    };

    return { students, assessments, grades, isLoading, updateGrade };
}