import { db, type Section } from '../services/db'; // Assuming Section interface in db.ts

export const sectionService = {
    getAll: () => db.sections.toArray(),
    getById: (id: string) => db.sections.get(id),
    create: (data: Omit<Section, 'id'>) => db.sections.add({ ...data, id: crypto.randomUUID() }),
    update: (id: string, data: Partial<Section>) => db.sections.update(id, data),
    delete: (id: string) => db.sections.delete(id),
};