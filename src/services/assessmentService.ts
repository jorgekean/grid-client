import { db, type Assessment } from "./db";


export const assessmentService = {
    getAll: () => db.assessments.toArray(),
    getByContext: (subjectId: string, termId: string) =>
        db.assessments.where({ subjectId, termId }).toArray(),
    getById: (id: string) => db.assessments.get(id),
    create: (data: Omit<Assessment, 'id'>) => db.assessments.add({ ...data, id: crypto.randomUUID() }),
    update: (id: string, data: Partial<Assessment>) => db.assessments.update(id, data),
    delete: (id: string) => db.assessments.delete(id),
};