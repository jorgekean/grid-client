import { useState, useEffect, useCallback } from 'react';
import { studentService } from '../services/studentService';
import type { Student } from '../services/db';

export function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await studentService.getAll();
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch student roster", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    return {
        students,
        isLoading,
        refresh: fetchStudents,
        getById: studentService.getById,
        update: studentService.update
    };
}