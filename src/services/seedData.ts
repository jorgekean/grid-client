import { db } from './db';

export const seedDatabase = async () => {
    // 1. Check if we already have data to prevent duplicates
    const termCount = await db.terms.count();
    const subjectCount = await db.subjects.count();

    if (termCount > 0 && subjectCount > 0) {
        console.log('Database already has data. Skipping seed.');
        return;
    }

    console.log('Seeding initial data for GRID...');

    // 2. Seed Academic Terms (2025-2026)
    const termIds = {
        q1: crypto.randomUUID(),
        q2: crypto.randomUUID(),
        q3: crypto.randomUUID(),
        q4: crypto.randomUUID(),
    };

    await db.terms.bulkAdd([
        {
            id: termIds.q1,
            year: '2025-2026',
            name: '1st Quarter',
            startDate: new Date('2025-08-01'),
            endDate: new Date('2025-10-15'),
            isLocked: false,
        },
        {
            id: termIds.q2,
            year: '2025-2026',
            name: '2nd Quarter',
            startDate: new Date('2025-10-20'),
            endDate: new Date('2025-12-20'),
            isLocked: false,
        },
        {
            id: termIds.q3,
            year: '2025-2026',
            name: '3rd Quarter',
            startDate: new Date('2026-01-05'),
            endDate: new Date('2026-03-20'),
            isLocked: false,
        },
        {
            id: termIds.q4,
            year: '2025-2026',
            name: '4th Quarter',
            startDate: new Date('2026-03-25'),
            endDate: new Date('2026-06-05'),
            isLocked: false,
        },
    ]);

    // 3. Seed Subjects with standard K-12 Weighting
    await db.subjects.bulkAdd([
        {
            id: crypto.randomUUID(),
            code: 'MATH-7',
            title: 'General Mathematics',
            gradeLevel: 7,
            wwWeight: 0.3, // 30%
            ptWeight: 0.5, // 50%
            qaWeight: 0.2, // 20%
        },
        {
            id: crypto.randomUUID(),
            code: 'SCI-7',
            title: 'Integrated Science',
            gradeLevel: 7,
            wwWeight: 0.3,
            ptWeight: 0.5,
            qaWeight: 0.2,
        },
        {
            id: crypto.randomUUID(),
            code: 'ENG-7',
            title: 'English & Literature',
            gradeLevel: 7,
            wwWeight: 0.3,
            ptWeight: 0.5,
            qaWeight: 0.2,
        },
        {
            id: crypto.randomUUID(),
            code: 'MAPEH-7',
            title: 'Music, Arts, PE & Health',
            gradeLevel: 7,
            wwWeight: 0.2, // 20% (Performance heavy)
            ptWeight: 0.6, // 60%
            qaWeight: 0.2, // 20%
        },
        {
            id: crypto.randomUUID(),
            code: 'TLE-7',
            title: 'Technology & Livelihood Education',
            gradeLevel: 7,
            wwWeight: 0.2,
            ptWeight: 0.6,
            qaWeight: 0.2,
        },
    ]);


    console.log('Seed complete.');
};