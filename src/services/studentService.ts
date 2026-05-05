import { db, type Student } from "./db";

export const studentService = {
    getAll: () => db.students.toArray(),
    getById: (id: string) => db.students.get(id),
    update: (id: string, data: Partial<Student>) => db.students.update(id, data),
};