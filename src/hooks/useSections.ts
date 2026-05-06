import { useState, useEffect, useCallback } from 'react';
import { sectionService } from '../services/sectionService';
import type { Section } from '../services/db';

export function useSections() {
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSections = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await sectionService.getAll();
            setSections(data);
        } catch (error) {
            console.error("Failed to fetch Sections", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    return {
        sections,
        isLoading,
        refresh: fetchSections,
        // Exposing service methods
        create: sectionService.create,
        update: sectionService.update,
        remove: sectionService.delete,
        getById: sectionService.getById
    };
}