import { db, type AcademicTerm } from '../services/db';

export const termService = {
    getAll: async (): Promise<AcademicTerm[]> => {
        return await db.terms.toArray();
    },

    getById: async (id: string): Promise<AcademicTerm | undefined> => {
        return await db.terms.get(id);
    },

    create: async (data: Omit<AcademicTerm, 'id'>): Promise<string> => {
        const id = crypto.randomUUID();
        await db.terms.add({
            ...data,
            id,
        });
        return id;
    },

    update: async (id: string, data: Partial<AcademicTerm>): Promise<number> => {
        return await db.terms.update(id, data);
    },

    delete: async (id: string): Promise<void> => {
        return await db.terms.delete(id);
    },
};