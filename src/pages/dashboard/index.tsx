import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import {
    Users,
    BookOpen,
    ClipboardCheck,
    TrendingUp,
    AlertCircle,
    Calendar,
    Award,
    Target,
    Clock,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    HelpCircle,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { useSubjects } from '../../hooks/useSubjects';
import { useAssessments } from '../../hooks/useAssessments';
import { useTerms } from '../../hooks/useTerms';
import { useProductTour } from '../../hooks/useProductTour';
import { db } from '../../services/db';
import type { Grade } from '../../services/db';
import { toast } from 'sonner';

interface StatCard {
    label: string;
    value: string | number;
    icon: React.ElementType;
    trend?: string;
    color: string;
}

export function Dashboard() {
    const { students } = useStudents();
    const { subjects } = useSubjects();
    const { assessments } = useAssessments();
    const { terms } = useTerms();

    const [grades, setGrades] = useState<Grade[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    // 🎯 PRODUCT TOUR
    const { startTour, TourComponent } = useProductTour('dashboard', () => {
        toast.success('🎉 Dashboard tour completed! You\'re ready to manage your classes!');
    });

    // Fetch all grades
    useEffect(() => {
        const fetchGrades = async () => {
            const allGrades = await db.grades.toArray();
            setGrades(allGrades);
        };
        fetchGrades();
    }, []);

    // Calculate statistics
    const stats = useMemo<StatCard[]>(() => {
        const activeStudents = students.length;
        const totalSubjects = subjects.length;
        const totalAssessments = assessments.length;
        const currentTerm = terms.find(t => {
            const now = new Date();
            return now >= new Date(t.startDate) && now <= new Date(t.endDate);
        });

        // Calculate grading completion
        const expectedGrades = assessments.length * students.length;
        const actualGrades = grades.length;
        const completionRate = expectedGrades > 0
            ? Math.round((actualGrades / expectedGrades) * 100)
            : 0;

        // Calculate average class performance
        const avgScore = grades.length > 0
            ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length
            : 0;

        return [
            {
                label: 'Total Students',
                value: activeStudents,
                icon: Users,
                color: 'blue',
                trend: 'All sections'
            },
            {
                label: 'Active Subjects',
                value: totalSubjects,
                icon: BookOpen,
                color: 'purple',
                trend: 'Teaching this year'
            },
            {
                label: 'Grading Progress',
                value: `${completionRate}%`,
                icon: ClipboardCheck,
                color: completionRate >= 80 ? 'green' : completionRate >= 50 ? 'yellow' : 'red',
                trend: `${actualGrades}/${expectedGrades} grades entered`
            },
            {
                label: 'Class Average',
                value: avgScore > 0 ? avgScore.toFixed(1) : '-',
                icon: TrendingUp,
                color: avgScore >= 85 ? 'green' : avgScore >= 75 ? 'yellow' : 'red',
                trend: 'Across all subjects'
            }
        ];
    }, [students, subjects, assessments, grades, terms]);

    // Grade distribution for chart
    const gradeDistribution = useMemo(() => {
        if (grades.length === 0) return [];

        const ranges = [
            { range: '90-100', min: 90, max: 100, count: 0, color: '#10b981' },
            { range: '85-89', min: 85, max: 89, count: 0, color: '#3b82f6' },
            { range: '80-84', min: 80, max: 84, count: 0, color: '#8b5cf6' },
            { range: '75-79', min: 75, max: 79, count: 0, color: '#f59e0b' },
            { range: 'Below 75', min: 0, max: 74, count: 0, color: '#ef4444' },
        ];

        grades.forEach(grade => {
            const range = ranges.find(r => grade.score >= r.min && grade.score <= r.max);
            if (range) range.count++;
        });

        return ranges;
    }, [grades]);

    // Subject performance
    const subjectPerformance = useMemo(() => {
        return subjects.map(subject => {
            const subjectAssessments = assessments.filter(a => a.subjectId === subject.id);
            const assessmentIds = subjectAssessments.map(a => a.id);
            const subjectGrades = grades.filter(g => assessmentIds.includes(g.assessmentId));

            const avgScore = subjectGrades.length > 0
                ? subjectGrades.reduce((sum, g) => sum + g.score, 0) / subjectGrades.length
                : 0;

            return {
                name: subject.title,
                average: avgScore,
                assessmentCount: subjectAssessments.length,
                gradeCount: subjectGrades.length
            };
        }).sort((a, b) => b.average - a.average);
    }, [subjects, assessments, grades]);

    // Upcoming assessments (last 5)
    const upcomingAssessments = useMemo(() => {
        return assessments
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [assessments]);

    // 📊 PENDING GRADES CALCULATION (Current Quarter Only) - Grouped by Subject/Section
    const pendingGrades = useMemo(() => {
        // Find current active term
        const now = new Date();
        const currentTerm = terms.find(t =>
            now >= new Date(t.startDate) && now <= new Date(t.endDate)
        );

        if (!currentTerm) {
            return {
                totalUngraded: 0,
                bySubjectSection: [],
                currentTermName: null,
                currentTermId: null,
                urgency: 'none' as 'none' | 'low' | 'medium' | 'high'
            };
        }

        // Get assessments for current term only
        const currentTermAssessments = assessments.filter(a => a.termId === currentTerm.id);

        // Get unique sections from students
        const sectionsSet = new Set(students.map(s => s.section));
        const sectionsList = Array.from(sectionsSet);

        // Group by subject and section combination
        const subjectSectionMap = new Map<string, {
            subjectId: string;
            subjectName: string;
            sectionName: string;
            ungradedCount: number;
            assessmentCount: number;
            mostOverdueDays: number;
            hasOverdue: boolean;
        }>();

        // For each subject-section combination, calculate ungraded
        subjects.forEach(subject => {
            sectionsList.forEach(section => {
                // Get assessments for this subject
                const subjectAssessments = currentTermAssessments.filter(a => a.subjectId === subject.id);
                if (subjectAssessments.length === 0) return;

                // Get students in this section
                const sectionStudents = students.filter(st => st.section === section);
                if (sectionStudents.length === 0) return;

                let totalUngradedForCombo = 0;
                let assessmentCountForCombo = 0;
                let maxDaysSince = 0;
                let hasAnyOverdue = false;

                // For each assessment in this subject
                subjectAssessments.forEach(assessment => {
                    // Count how many students in this section don't have grades for this assessment
                    const sectionStudentIds = sectionStudents.map(st => st.id);
                    const assessmentGrades = grades.filter(g =>
                        g.assessmentId === assessment.id &&
                        sectionStudentIds.includes(g.studentId)
                    );

                    const ungradedForAssessment = sectionStudents.length - assessmentGrades.length;

                    if (ungradedForAssessment > 0) {
                        totalUngradedForCombo += ungradedForAssessment;
                        assessmentCountForCombo += 1;

                        // Calculate days since assessment
                        const daysSince = Math.floor((now.getTime() - new Date(assessment.date).getTime()) / (1000 * 60 * 60 * 24));
                        maxDaysSince = Math.max(maxDaysSince, daysSince);
                        hasAnyOverdue = hasAnyOverdue || daysSince > 7;
                    }
                });

                // Only add if there are ungraded items
                if (totalUngradedForCombo > 0) {
                    const key = `${subject.id}-${section}`;
                    subjectSectionMap.set(key, {
                        subjectId: subject.id,
                        subjectName: subject.title,
                        sectionName: section,
                        ungradedCount: totalUngradedForCombo,
                        assessmentCount: assessmentCountForCombo,
                        mostOverdueDays: maxDaysSince,
                        hasOverdue: hasAnyOverdue
                    });
                }
            });
        });

        // Convert to array and sort by most overdue first
        const bySubjectSection = Array.from(subjectSectionMap.values())
            .sort((a, b) => {
                // First sort by overdue status
                if (a.hasOverdue !== b.hasOverdue) return a.hasOverdue ? -1 : 1;
                // Then by days overdue
                return b.mostOverdueDays - a.mostOverdueDays;
            });

        const totalUngraded = bySubjectSection.reduce((sum, item) => sum + item.ungradedCount, 0);

        // Determine urgency level
        let urgency: 'none' | 'low' | 'medium' | 'high' = 'none';
        if (totalUngraded === 0) urgency = 'none';
        else if (totalUngraded <= 5) urgency = 'low';
        else if (totalUngraded <= 15) urgency = 'medium';
        else urgency = 'high';

        return {
            totalUngraded,
            bySubjectSection,
            currentTermName: currentTerm.name,
            currentTermId: currentTerm.id,
            urgency
        };
    }, [assessments, grades, students, terms, subjects]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div data-tour="page-title">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Teacher Dashboard
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Welcome back! Here's an overview of your classes and student performance.
                    </p>
                </div>

                {/* Help Button */}
                <button
                    onClick={startTour}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
                    title="Get help navigating the dashboard"
                >
                    <HelpCircle className="w-4 h-4" />
                    Need Help?
                </button>
            </header>

            {/* Stats Grid */}
            <div data-tour="stats-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    const colorClasses = {
                        blue: 'from-blue-500 to-blue-600',
                        purple: 'from-purple-500 to-purple-600',
                        green: 'from-green-500 to-green-600',
                        yellow: 'from-yellow-500 to-yellow-600',
                        red: 'from-red-500 to-red-600'
                    }[stat.color];

                    return (
                        <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses} shadow-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                    {stat.label}
                                </p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                                    {stat.value}
                                </p>
                                {stat.trend && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {stat.trend}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 🎯 PENDING GRADES WIDGET - Conditionally shown */}
            {pendingGrades.totalUngraded > 0 && (
                <div data-tour="pending-grades" className={`rounded-2xl p-6 border-2 shadow-lg ${pendingGrades.urgency === 'high'
                    ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-300 dark:border-red-800'
                    : pendingGrades.urgency === 'medium'
                        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300 dark:border-yellow-800'
                        : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-300 dark:border-blue-800'
                    }`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl shrink-0 ${pendingGrades.urgency === 'high'
                            ? 'bg-red-500'
                            : pendingGrades.urgency === 'medium'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                            }`}>
                            {pendingGrades.urgency === 'high' ? (
                                <AlertTriangle className="w-6 h-6 text-white" />
                            ) : (
                                <AlertCircle className="w-6 h-6 text-white" />
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className={`text-lg font-bold mb-1 ${pendingGrades.urgency === 'high'
                                        ? 'text-red-900 dark:text-red-100'
                                        : pendingGrades.urgency === 'medium'
                                            ? 'text-yellow-900 dark:text-yellow-100'
                                            : 'text-blue-900 dark:text-blue-100'
                                        }`}>
                                        ⚠️ Pending Grades ({pendingGrades.currentTermName})
                                    </h3>
                                    <p className={`text-2xl font-black ${pendingGrades.urgency === 'high'
                                        ? 'text-red-600 dark:text-red-400'
                                        : pendingGrades.urgency === 'medium'
                                            ? 'text-yellow-600 dark:text-yellow-400'
                                            : 'text-blue-600 dark:text-blue-400'
                                        }`}>
                                        {pendingGrades.totalUngraded} grades needed across {pendingGrades.bySubjectSection.length} {pendingGrades.bySubjectSection.length === 1 ? 'class' : 'classes'}
                                    </p>
                                </div>
                            </div>

                            {/* 📚 Breakdown by Subject-Section */}
                            <div className="space-y-2">
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Click to grade each class:
                                </p>
                                {pendingGrades.bySubjectSection.slice(0, 5).map((item) => (
                                    <div
                                        key={`${item.subjectId}-${item.sectionName}`}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${item.hasOverdue
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                            : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className={`font-bold text-sm ${item.hasOverdue
                                                    ? 'text-red-900 dark:text-red-100'
                                                    : 'text-slate-900 dark:text-slate-100'
                                                    }`}>
                                                    📚 {item.subjectName}
                                                </p>
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    {item.sectionName}
                                                </span>
                                                {item.hasOverdue && (
                                                    <span className="text-xs font-black text-red-600 dark:text-red-400">
                                                        ({item.mostOverdueDays} days overdue)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                {item.ungradedCount} grades across {item.assessmentCount} {item.assessmentCount === 1 ? 'assessment' : 'assessments'}
                                            </p>
                                        </div>

                                        <Link
                                            to={`/grid-client/gradebook?subject=${item.subjectId}&section=${item.sectionName}&term=${pendingGrades.currentTermId}&filter=ungraded`}
                                            className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-105 active:scale-95 ${item.hasOverdue
                                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                                : 'bg-primary-500 hover:bg-primary-600 text-white'
                                                }`}
                                        >
                                            Grade Now
                                            <ClipboardCheck className="w-3 h-3" />
                                        </Link>
                                    </div>
                                ))}

                                {pendingGrades.bySubjectSection.length > 5 && (
                                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2 italic">
                                        Showing top 5 most urgent
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Caught Up Message - When no pending grades */}
            {pendingGrades.totalUngraded === 0 && pendingGrades.currentTermName && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-800 rounded-2xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500 rounded-xl shrink-0">
                            <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-1">
                                ✅ All Caught Up!
                            </h3>
                            <p className="text-sm text-green-800 dark:text-green-200">
                                Great job! All grades for <strong>{pendingGrades.currentTermName}</strong> are entered.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Grade Distribution Chart */}
                <div data-tour="grade-distribution" className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-primary-600" />
                                Grade Distribution
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Overall performance across all assessments
                            </p>
                        </div>
                    </div>

                    {grades.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Activity className="w-12 h-12 text-slate-300 mb-3" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">No grades yet</p>
                            <p className="text-sm text-slate-400 mt-1">Start entering grades to see distribution</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {gradeDistribution.map((range) => {
                                const percentage = grades.length > 0 ? (range.count / grades.length) * 100 : 0;
                                return (
                                    <div key={range.range}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {range.range}
                                            </span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                {range.count} students ({percentage.toFixed(0)}%)
                                            </span>
                                        </div>
                                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: range.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div data-tour="quick-actions" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary-600" />
                        Quick Actions
                    </h2>
                    <div className="space-y-3">
                        <Link
                            to="/grid-client/gradebook"
                            className="block p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                    <ClipboardCheck className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-blue-900 dark:text-blue-100">Enter Grades</p>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">Update student scores</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/grid-client/assessments"
                            className="block p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-purple-900 dark:text-purple-100">Create Assessment</p>
                                    <p className="text-xs text-purple-700 dark:text-purple-300">Add new quiz or exam</p>
                                </div>
                            </div>
                        </Link>

                        <Link
                            to="/grid-client/students"
                            className="block p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-800 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500 rounded-lg">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-green-900 dark:text-green-100">View Students</p>
                                    <p className="text-xs text-green-700 dark:text-green-300">Check roster & profiles</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Subject Performance */}
                <div data-tour="subject-performance" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary-600" />
                        Subject Performance
                    </h2>

                    {subjectPerformance.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <BookOpen className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-slate-500 dark:text-slate-400">No subjects yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {subjectPerformance.map((subject) => (
                                <div key={subject.name} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold text-slate-900 dark:text-white">
                                            {subject.name}
                                        </span>
                                        <span className={`text-lg font-black ${subject.average >= 85 ? 'text-green-600' :
                                            subject.average >= 75 ? 'text-yellow-600' :
                                                'text-red-600'
                                            }`}>
                                            {subject.average > 0 ? subject.average.toFixed(1) : '-'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                        <span>{subject.assessmentCount} assessments</span>
                                        <span>•</span>
                                        <span>{subject.gradeCount} grades recorded</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Assessments */}
                <div data-tour="recent-assessments" className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary-600" />
                        Recent Assessments
                    </h2>

                    {upcomingAssessments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Calendar className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-slate-500 dark:text-slate-400">No assessments yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingAssessments.map((assessment) => {
                                const subject = subjects.find(s => s.id === assessment.subjectId);
                                const categoryColors = {
                                    WW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                                    PT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
                                    QA: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                };

                                return (
                                    <div key={assessment.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-900 dark:text-white mb-1">
                                                    {assessment.title}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    {subject?.title || 'Unknown Subject'}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${categoryColors[assessment.category]}`}>
                                                {assessment.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                            <span>{new Date(assessment.date).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{assessment.maxScore} points</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Help Tip */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500 rounded-xl shrink-0">
                        <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                            💡 Pro Tip: Stay on Track
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                            Keep your gradebook up to date by entering scores right after assessments.
                            The system automatically calculates weighted grades, saving you time and ensuring accuracy!
                        </p>
                    </div>
                </div>
            </div>

            {/* Product Tour */}
            {TourComponent}
        </div>
    );
}
