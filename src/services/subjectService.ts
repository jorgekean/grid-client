import { db, type Subject } from '../services/db';

export const subjectService = {
    getAll: () => db.subjects.toArray(),
    getById: (id: string) => db.subjects.get(id),
    create: (data: Omit<Subject, 'id'>) => db.subjects.add({ ...data, id: crypto.randomUUID() }),
    update: (id: string, data: Partial<Subject>) => db.subjects.update(id, data),
    delete: (id: string) => db.subjects.delete(id),
};