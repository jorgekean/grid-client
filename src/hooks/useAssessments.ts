import { useState, useEffect, useCallback } from 'react';
import { assessmentService } from '../services/assessmentService';
import type { Assessment } from '../services/db';

export function useAssessments(subjectId?: string, termId?: string) {
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = subjectId && termId
                ? await assessmentService.getByContext(subjectId, termId)
                : await assessmentService.getAll();
            setAssessments(data);
        } catch (err) { console.error(err); }
        finally { setIsLoading(false); }
    }, [subjectId, termId]);

    useEffect(() => { refresh(); }, [refresh]);

    return { assessments, isLoading, refresh, ...assessmentService };
}