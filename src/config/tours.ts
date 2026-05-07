// ============================================================================
// 🎯 PRODUCT TOURS CONFIGURATION
// ============================================================================
// 
// This centralized file manages all product tours across the application.
// 
// 📚 HOW TO ADD A NEW TOUR:
// 1. Import TourStep type
// 2. Create a new tour configuration object
// 3. Export it for use in your page component
// 
// 💡 BENEFITS:
// - Single source of truth for all tours
// - Easy to update tour content
// - Reusable across pages
// - Version control friendly
// - Easy to translate (i18n ready)
// ============================================================================

import type { TourStep } from '../components/ui/ProductTour';

// ============================================================================
// 📚 GRADEBOOK TOUR
// ============================================================================
export const gradebookTour: TourStep[] = [
    {
        target: '[data-tour="page-title"]',
        title: 'Welcome to the Gradebook! 👋',
        content: 'This is where you enter student scores and the system automatically calculates grades using the DepEd K-12 formula. Let me show you around!',
        placement: 'bottom',
    },
    {
        target: '[data-tour="subject-selector"]',
        title: 'Step 1: Select Your Subject',
        content: 'Choose the subject you want to grade from this dropdown. This could be Mathematics, English, Science, or any subject you teach.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="section-selector"]',
        title: 'Step 2: Choose Your Section',
        content: 'Pick the class section you\'re grading. For example: Einstein, Newton, or Grade 7-A. This loads the students in that class.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="term-selector"]',
        title: 'Step 3: Pick the Quarter',
        content: 'Select the grading period (1st Quarter, 2nd Quarter, etc.). All three selections are required to load the gradebook.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="help-button"]',
        title: 'Need Help Anytime? 💡',
        content: 'Click the "Need Help?" button anytime you want to see this guide again. It\'s always here to help you navigate the system!',
        placement: 'left',
    },
    {
        target: 'table thead th:nth-child(2)',
        title: 'Understanding the Columns',
        content: 'Each column represents a quiz, project, or exam. The colored badges show the type: Blue = Written Works (WW), Purple = Performance Tasks (PT), Orange = Quarterly Assessment (QA).',
        placement: 'bottom',
    },
    {
        target: 'table tbody tr:first-child td:nth-child(2)',
        title: 'Entering Grades is Easy! ✍️',
        content: 'Click any cell to enter a student\'s score. Type the number and press Enter or click outside. A green checkmark means it saved successfully!',
        placement: 'bottom',
    },
    {
        target: 'table thead th:nth-last-child(3)',
        title: 'Automatic Calculations',
        content: 'These columns show the weighted totals for Written Works and Performance Tasks. The system calculates these based on all entered scores.',
        placement: 'top',
    },
    {
        target: 'table thead th:last-child',
        title: 'Final Grade - No Calculator Needed! 🎯',
        content: 'This column shows the automatically calculated final grade using the official K-12 weighted formula. It updates instantly as you enter scores!',
        placement: 'top',
    },
    {
        target: '[data-tour="page-title"]',
        title: 'You\'re All Set! 🎉',
        content: 'That\'s it! You\'re ready to start grading. Remember: just select your class, enter scores, and the system does the math. Click "Got it!" to begin!',
        placement: 'bottom',
    },
];

// ============================================================================
// 📊 STUDENT ROSTER TOUR
// ============================================================================
export const studentRosterTour: TourStep[] = [
    {
        target: '[data-tour="page-title"]',
        title: 'Welcome to Student Roster! 👥',
        content: 'This is where you view all your students and access their profiles. Let me show you what you can do here!',
        placement: 'bottom',
    },
    {
        target: '[data-tour="search-box"]',
        title: 'Quick Search 🔍',
        content: 'Type a student\'s name, ID number, or section to quickly find them. The list filters as you type!',
        placement: 'bottom',
    },
    {
        target: '[data-tour="student-list"]',
        title: 'Student List',
        content: 'Here you\'ll see all enrolled students with their basic information: name, student number, grade level, and section.',
        placement: 'right',
    },
    {
        target: '[data-tour="action-buttons"]',
        title: 'Quick Actions',
        content: 'Each student has action buttons: View Performance to see grades, and Print SF9 to generate their report card.',
        placement: 'left',
    },
];

// ============================================================================
// 📝 ASSESSMENTS TOUR
// ============================================================================
export const assessmentsTour: TourStep[] = [
    {
        target: '[data-tour="page-title"]',
        title: 'Welcome to Assessments! 📝',
        content: 'This is where you create and manage quizzes, projects, and exams. Let me guide you through it!',
        placement: 'bottom',
    },
    {
        target: '[data-tour="add-button"]',
        title: 'Create New Assessment',
        content: 'Click this button to create a new quiz, performance task, or quarterly assessment for any subject.',
        placement: 'left',
    },
    {
        target: '[data-tour="filter-section"]',
        title: 'Filter Your Assessments',
        content: 'Use these filters to view assessments by subject, quarter, or category (WW, PT, QA).',
        placement: 'bottom',
    },
];

// ============================================================================
// 📅 ACADEMIC TERMS TOUR
// ============================================================================
export const academicTermsTour: TourStep[] = [
    {
        target: '[data-tour="page-title"]',
        title: 'Welcome to Academic Terms! 📅',
        content: 'Here you manage grading periods (quarters) for the school year. Each term has start and end dates.',
        placement: 'bottom',
    },
    {
        target: '[data-tour="add-term"]',
        title: 'Add New Quarter',
        content: 'Click here to create a new grading period. You\'ll set the quarter name, school year, and date range.',
        placement: 'left',
    },
    {
        target: '[data-tour="term-list"]',
        title: 'Your Quarters',
        content: 'All grading periods are listed here. You can see which quarters are active, upcoming, or completed.',
        placement: 'right',
    },
];

// ============================================================================
// 🎓 SUBJECTS TOUR
// ============================================================================
export const subjectsTour: TourStep[] = [
    {
        target: '[data-tour="page-title"]',
        title: 'Welcome to Subjects! 🎓',
        content: 'This is where you manage all subjects and configure their grading weights (WW, PT, QA percentages).',
        placement: 'bottom',
    },
    {
        target: '[data-tour="add-subject"]',
        title: 'Add New Subject',
        content: 'Create a new subject by clicking here. You\'ll set the subject name, code, and configure the grading weights.',
        placement: 'left',
    },
    {
        target: '[data-tour="weight-info"]',
        title: 'Understanding Weights ⚖️',
        content: 'Each subject shows its WW, PT, and QA weights. These percentages must add up to 100% and determine how grades are calculated.',
        placement: 'bottom',
    },
];

// ============================================================================
// 🎯 TOUR METADATA & CONFIGURATION
// ============================================================================

export interface TourConfig {
    id: string;              // Unique identifier
    storageKey: string;      // localStorage key for completion tracking
    steps: TourStep[];       // Tour steps
    autoStart?: boolean;     // Auto-start for first-time users?
    delay?: number;          // Delay before auto-start (ms)
}

export const tourConfigs: Record<string, TourConfig> = {
    gradebook: {
        id: 'gradebook',
        storageKey: 'gradebook-tour-completed',
        steps: gradebookTour,
        autoStart: true,
        delay: 1000,
    },
    students: {
        id: 'students',
        storageKey: 'students-tour-completed',
        steps: studentRosterTour,
        autoStart: true,
        delay: 1000,
    },
    assessments: {
        id: 'assessments',
        storageKey: 'assessments-tour-completed',
        steps: assessmentsTour,
        autoStart: true,
        delay: 1000,
    },
    terms: {
        id: 'terms',
        storageKey: 'terms-tour-completed',
        steps: academicTermsTour,
        autoStart: true,
        delay: 1000,
    },
    subjects: {
        id: 'subjects',
        storageKey: 'subjects-tour-completed',
        steps: subjectsTour,
        autoStart: true,
        delay: 1000,
    },
};

// ============================================================================
// 🛠️ HELPER FUNCTIONS
// ============================================================================

/**
 * Get tour configuration by ID
 */
export function getTourConfig(tourId: string): TourConfig | undefined {
    return tourConfigs[tourId];
}

/**
 * Check if a tour has been completed
 */
export function isTourCompleted(tourId: string): boolean {
    const config = tourConfigs[tourId];
    if (!config) return true;
    return localStorage.getItem(config.storageKey) === 'true';
}

/**
 * Mark a tour as completed
 */
export function completeTour(tourId: string): void {
    const config = tourConfigs[tourId];
    if (config) {
        localStorage.setItem(config.storageKey, 'true');
    }
}

/**
 * Reset a tour (mark as not completed)
 */
export function resetTour(tourId: string): void {
    const config = tourConfigs[tourId];
    if (config) {
        localStorage.removeItem(config.storageKey);
    }
}

/**
 * Reset all tours
 */
export function resetAllTours(): void {
    Object.values(tourConfigs).forEach(config => {
        localStorage.removeItem(config.storageKey);
    });
}

/**
 * Get list of all available tours
 */
export function getAllTourIds(): string[] {
    return Object.keys(tourConfigs);
}
