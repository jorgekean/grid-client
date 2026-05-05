import { useState, useEffect, useCallback } from 'react';
import { subjectService } from '../services/subjectService';
import type { Subject } from '../services/db';

export function useSubjects() {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSubjects = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await subjectService.getAll();
            setSubjects(data);
        } catch (error) {
            console.error("Failed to fetch subjects", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubjects();
    }, [fetchSubjects]);

    return {
        subjects,
        isLoading,
        refresh: fetchSubjects,
        getById: subjectService.getById,
        create: subjectService.create,
        update: subjectService.update,
        remove: subjectService.delete
    };
}