import { useState, useEffect, useCallback } from 'react';
import { termService } from '../services/termService';
import type { AcademicTerm } from '../services/db';

export function useTerms() {
    const [terms, setTerms] = useState<AcademicTerm[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTerms = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await termService.getAll();
            setTerms(data);
        } catch (error) {
            console.error("Failed to fetch academic terms", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTerms();
    }, [fetchTerms]);

    return {
        terms,
        isLoading,
        refresh: fetchTerms,
        // Exposing service methods
        create: termService.create,
        update: termService.update,
        remove: termService.delete,
        getById: termService.getById
    };
}