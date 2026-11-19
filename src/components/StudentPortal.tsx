import React, { useMemo, useState } from 'react';
import {
  Bell,
  Trophy,
  CalendarDays,
  ClipboardCheck,
  BookOpen,
  Receipt,
  Award,
  LogOut,
  Lock,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  Printer,
  X,
  ArrowRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import { INSTITUTE_LOGO_IMAGE } from '../data/seedData';
import {
  ALL_DAYS,
  AppData,
  ExamQuestion,
  ExamSubmission,
  FeePayment,
  FULL_DAY_NAMES,
  Student,
} from '../types';
import {
  buildWhatsAppHref,
  calculateAttendancePercentage,
  formatReadableDate,
  getTodayISO,
  isStudentLockedByMandatoryExam,
} from '../utils/helpers';
import { CertificateRenderer } from './CertificateRenderer';

interface StudentPortalProps {
  data: AppData;
  student: Student;
  onLogout: () => void;
  onSubmitExam: (
    studentId: string,
    submission: ExamSubmission,
    unlockMandatory: boolean
  ) => void;
  onMarkNotificationsRead: (studentId: string) => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, description?: string) => void;
}

type StudentTab = 'schedule' | 'exams' | 'courses' | 'fees' | 'certificate';

export const StudentPortal: React.FC<StudentPortalProps> = ({
  data,
  student,
  onLogout,
  onSubmitExam,
  onMarkNotificationsRead,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTab>('schedule');
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);

  // Interactive MCQ Exam state
  const [examInProgress, setExamInProgress] = useState<{
    isMandatory: boolean;
    title: string;
    questions: ExamQuestion[];
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [lastResult, setLastResult] = useState<{
    title: string;
    score: number;
    maxScore: number;
    correctCount: number;
    totalQuestions: number;
    percentage: number;
    unlockedDashboard: boolean;
  } | null>(null);

  const course = useMemo(
    () => data.courses.find((c) => c.id === student.courseId),
    [data.courses, student.courseId]
  );

  const isMandatoryLocked = useMemo(() => isStudentLockedByMandatoryExam(student), [student]);
  const attendancePct = useMemo(() => calculateAttendancePercentage(student), [student]);
  const unreadNotifs = useMemo(
    () => student.notifications.filter((n) => !n.read).length,
    [student.notifications]
  );

  const courseQuestions = useMemo(() => {
    const matched = data.questions.filter((q) => q.courseId === student.courseId);
    if (matched.length > 0) return matched;
    return data.questions.slice(0, 4);
  }, [data.questions, student.courseId]);

  const startExam = (isMandatory: boolean) => {
    if (courseQuestions.length === 0) {
      onNotify('warning', 'No Exam Questions Available', 'Ask JIT Admin to add MCQ questions for your course.');
      return;
    }
    setAnswers({});
    setLastResult(null);
    setExamInProgress({
      isMandatory,
      title: isMandatory
        ? student.mandatoryExamLabel || `3-Month Mandatory Quarterly Exam (${course?.code || 'JIT'})`
        : `${course?.code || 'JIT'} Practice & Points Assessment`,
      questions: courseQuestions,
    });
    setActiveTab('exams');
  };

  const handleExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examInProgress) return;

    const unanswered = examInProgress.questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      onNotify(
        'warning',
        `${unanswered.length} Question${unanswered.length > 1 ? 's' : ''} Remaining`,
        'Please select an answer for every question before submitting.'
      );
      return;
    }

    let score = 0;
    let maxScore = 0;
    let correctCount = 0;

    examInProgress.questions.forEach((q) => {
      maxScore += q.points;
      if (answers[q.id] === q.correctIndex) {
        score += q.points;
        correctCount += 1;
      }
    });

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    const submission: ExamSubmission = {
      id: `sub-${Date.now()}`,
      examTitle: examInProgress.title,
      submittedAt: getTodayISO(),
      score,
      maxScore,
      percentage,
      isMandatoryQuarterly: examInProgress.isMandatory,
    };

    onSubmitExam(student.id, submission, examInProgress.isMandatory);

    setLastResult({
      title: examInProgress.title,
      score,
      maxScore,
      correctCount,
      totalQuestions: examInProgress.questions.length,
      percentage,
      unlockedDashboard: examInProgress.isMandatory,
    });
    setExamInProgress(null);

    onNotify(
      'success',
      `Exam Submitted — +${score} Points Earned`,
      examInProgress.isMandatory
        ? 'Your 3-month mandatory exam is complete and your dashboard is now unlocked.'
        : `You scored ${score}/${maxScore} (${percentage}%). Points added to your header total.`
    );
  };

  const navItems: { id: StudentTab; label: string; icon: React.ReactNode }[] = [
    { id: 'schedule', label: 'Schedule & Attendance', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'exams', label: 'MCQ Exam Center', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'courses', label: 'Courses & Fees', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'fees', label: 'My Fee Receipts', icon: <Receipt className="w-4 h-4" /> },
    { id: 'certificate', label: 'Certificate', icon: <Award className="w-4 h-4" /> },
  ];

  const presentCount = student.attendance.filter((a) => a.status === 'Present').length;
  const absentCount = student.attendance.filter((a) => a.status === 'Absent').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP HEADER BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand + Student Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={INSTITUTE_LOGO_IMAGE}
              alt="Jharna Institute of Technology (JIT) Official Logo"
              referrerPolicy="no-referrer"
              className="h-10 sm:h-11 w-auto object-contain rounded-md bg-white shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm sm:text-base text-slate-900 truncate">
                  {student.name}
                </span>
                <span className="hidden sm:inline text-slate-300" aria-hidden="true">·</span>
                <span className="hidden sm:inline font-mono-num text-xs font-semibold text-blue-900 whitespace-nowrap">
                  {student.rollId}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {course ? `${course.code} — ${course.name}` : 'JIT Student Portal'}
              </p>
            </div>
          </div>

          {/* Right Controls: Prominent Total Exam Points + Notification Bell + Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Prominent Total Exam Points Display */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950 text-white"
              title="Total cumulative exam points earned"
            >
              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="font-mono-num text-sm font-bold">{student.examPoints}</span>
                <span className="text-[11px] text-blue-200 hidden sm:inline">Exam Points</span>
                <span className="text-[11px] text-blue-200 sm:hidden">Pts</span>
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Open notifications"
                className="relative p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white font-mono-num text-[10px] font-bold flex items-center justify-center">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Institute Notices &amp; Alerts
                    </h3>
                    {unreadNotifs > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onMarkNotificationsRead(student.id);
                          onNotify('info', 'Notifications marked as read');
                        }}
                        className="text-xs font-semibold text-blue-800 hover:text-blue-950"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {student.notifications.length === 0 ? (
                      <p className="p-5 text-sm text-slate-500 text-center">
                        No notices or fee alerts right now.
                      </p>
                    ) : (
                      student.notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 text-sm ${n.read ? 'bg-white' : 'bg-blue-50/50'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900 text-xs sm:text-sm">{n.title}</p>
                            <span className="font-mono-num text-[11px] text-slate-400 whitespace-nowrap">
                              {formatReadableDate(n.date)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* BODY LAYOUT: Sidebar (Desktop) + Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar & Mobile Horizontal Scroll Nav */}
        <aside className="lg:w-64 shrink-0 no-print">
          <div className="bg-white border border-slate-200 rounded-xl p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const lockedTab = isMandatoryLocked && item.id !== 'exams';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    {item.label}
                  </span>
                  {lockedTab && <Lock className="w-3.5 h-3.5 opacity-70 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Quiet Academic Summary Box on Desktop */}
          <div className="hidden lg:block mt-4 bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
            <p className="font-display font-bold text-slate-900 text-sm">Academic Profile</p>
            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between gap-2">
                <span>Roll ID</span>
                <span className="font-mono-num font-semibold text-slate-900">{student.rollId}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Admitted</span>
                <span className="font-mono-num text-slate-900">{formatReadableDate(student.admissionDate)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Course Status</span>
                <span
                  className={`font-semibold ${
                    student.courseStatus === 'Completed' ? 'text-emerald-700' : 'text-blue-800'
                  }`}
                >
                  {student.courseStatus}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Fee Status</span>
                <span
                  className={`font-semibold ${
                    student.feeStatus === 'Paid' ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {student.feeStatus}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 min-w-0">
          {/* 3-MONTH MANDATORY EXAM LOCK OVERLAY (when locked and NOT currently taking the exam) */}
          {isMandatoryLocked && !examInProgress ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 max-w-2xl mx-auto">
              <div className="w-14 h-14 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mb-6">
                <Lock className="w-7 h-7" />
              </div>

              <p className="text-xs font-semibold text-amber-700 tracking-wide">
                JIT Quarterly Academic Policy
              </p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tracking-tight">
                Quarterly Mandatory Exam Required
              </h1>
              <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
                Every 3 months from admission (or upon scheduled quarterly evaluation), JIT Computer Training Institute requires students to complete their in-app MCQ assessment. Attendance logs, fee receipts, and course modules are temporarily paused until this exam is submitted.
              </p>

              <div className="mt-6 py-4 border-y border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Scheduled Assessment</p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {student.mandatoryExamLabel || '3-Month Quarterly MCQ'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Course</p>
                  <p className="font-semibold text-slate-900 mt-0.5">{course?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Questions</p>
                  <p className="font-mono-num font-semibold text-slate-900 mt-0.5">
                    {courseQuestions.length} MCQs
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={() => startExam(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  Start Mandatory Exam
                  <ArrowRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-500">
                  Submitting instantly scores your test, adds Exam Points, and unlocks your full portal.
                </span>
              </div>
            </div>
          ) : examInProgress ? (
            /* LIVE INTERACTIVE MCQ EXAM PLAYER */
            <form
              onSubmit={handleExamSubmit}
              className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <p className="text-xs font-semibold text-indigo-700">
                    {examInProgress.isMandatory ? 'Mandatory 3-Month Evaluation' : 'Practice Assessment'}
                  </p>
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                    {examInProgress.title}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Answer all {examInProgress.questions.length} multiple-choice questions below.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-num text-xs font-semibold text-slate-600">
                    Answered: {Object.keys(answers).length}/{examInProgress.questions.length}
                  </span>
                  {!examInProgress.isMandatory && (
                    <button
                      type="button"
                      onClick={() => setExamInProgress(null)}
                      className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {examInProgress.questions.map((q, idx) => (
                  <div key={q.id} className="pb-6 border-b border-slate-100 last:border-b-0 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <p className="text-sm sm:text-base font-semibold text-slate-900">
                        <span className="font-mono-num text-blue-900 mr-2">{idx + 1}.</span>
                        {q.question}
                      </p>
                      <span className="font-mono-num text-xs text-slate-500 whitespace-nowrap shrink-0">
                        {q.points} pts
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, optIdx) => {
                        const selected = answers[q.id] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                            className={`text-left px-4 py-3 rounded-xl border text-sm transition-colors flex items-center gap-3 ${
                              selected
                                ? 'border-blue-800 bg-blue-50 text-blue-950 font-semibold'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-md font-mono-num text-xs font-bold flex items-center justify-center shrink-0 ${
                                selected ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Submitting will instantly grade your responses and add earned points to your profile.
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                >
                  <Check className="w-4 h-4" />
                  Submit Exam &amp; Claim Points
                </button>
              </div>
            </form>
          ) : (
            /* UNLOCKED STUDENT MODULES */
            <div className="space-y-6">
              {/* TAB 1: WEEKLY CLASS SCHEDULE & ATTENDANCE (DAY-ONLY) */}
              {activeTab === 'schedule' && (
                <>
                  {/* Top KPI Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs text-slate-500">Attendance Rate</p>
                      <p className="font-mono-num text-2xl font-bold text-blue-950 mt-1">
                        {attendancePct}%
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {presentCount} Present · {absentCount} Absent
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs text-slate-500">Assigned Days / Week</p>
                      <p className="font-mono-num text-2xl font-bold text-indigo-950 mt-1">
                        {student.scheduledDays.length}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {student.scheduledDays.join(', ') || 'Not assigned yet'}
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs text-slate-500">Total Exam Points</p>
                      <p className="font-mono-num text-2xl font-bold text-emerald-700 mt-1">
                        {student.examPoints}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {student.examHistory.length} exam{student.examHistory.length === 1 ? '' : 's'} taken
                      </p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-xs text-slate-500">Monthly Fee Status</p>
                      <p
                        className={`font-display text-2xl font-bold mt-1 ${
                          student.feeStatus === 'Paid' ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {student.feeStatus}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {student.feeHistory.length} receipt{student.feeHistory.length === 1 ? '' : 's'} on file
                      </p>
                    </div>
                  </div>

                  {/* Weekly Day-Only Class Schedule */}
                  <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                      <div>
                        <h2 className="font-display text-lg font-bold text-slate-900">
                          Weekly Class Schedule (Day-Only)
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                          Assigned attendance days for {course?.name || 'your course'}. Flexible lab hours apply on assigned days.
                        </p>
                      </div>
                      <span className="text-xs font-medium text-slate-600">
                        {student.scheduledDays.map((d) => FULL_DAY_NAMES[d]).join(' · ') || 'Awaiting day assignment'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
                      {ALL_DAYS.map((day) => {
                        const assigned = student.scheduledDays.includes(day);
                        return (
                          <div
                            key={day}
                            className={`rounded-xl border p-3.5 text-center transition-colors ${
                              assigned
                                ? 'bg-blue-900 border-blue-900 text-white'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <p className="font-display text-sm font-bold">{day}</p>
                            <p className={`text-[11px] mt-1 ${assigned ? 'text-blue-200' : 'text-slate-400'}`}>
                              {assigned ? 'Class Day' : 'Off Day'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Attendance History Log */}
                  <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex items-center justify-between gap-4">
                      <div>
                        <h2 className="font-display text-lg font-bold text-slate-900">
                          Attendance History Log
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Daily Present / Absent records updated by JIT faculty
                        </p>
                      </div>
                      <span className="font-mono-num text-sm font-bold text-blue-950">
                        {attendancePct}% Overall
                      </span>
                    </div>

                    {student.attendance.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500">
                        No attendance entries recorded yet. Your records will appear here once classes begin.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                              <th className="py-3 px-5">Date</th>
                              <th className="py-3 px-5">Class Day</th>
                              <th className="py-3 px-5 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {[...student.attendance]
                              .sort((a, b) => b.date.localeCompare(a.date))
                              .map((rec) => (
                                <tr key={rec.id} className="hover:bg-slate-50/70">
                                  <td className="py-3 px-5 font-mono-num text-slate-900">
                                    {formatReadableDate(rec.date)}
                                  </td>
                                  <td className="py-3 px-5 text-slate-700">{FULL_DAY_NAMES[rec.day]}</td>
                                  <td className="py-3 px-5 text-right">
                                    <span
                                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                        rec.status === 'Present' ? 'text-emerald-700' : 'text-red-700'
                                      }`}
                                    >
                                      {rec.status === 'Present' ? (
                                        <CheckCircle2 className="w-4 h-4" />
                                      ) : (
                                        <XCircle className="w-4 h-4" />
                                      )}
                                      {rec.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* TAB 2: IN-APP MCQ EXAM CENTER */}
              {activeTab === 'exams' && (
                <div className="space-y-6">
                  {lastResult && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-display font-bold text-emerald-950 text-base">
                            {lastResult.title} Completed!
                          </h3>
                          <p className="text-sm text-emerald-800 mt-0.5">
                            You answered {lastResult.correctCount} of {lastResult.totalQuestions} correctly and earned{' '}
                            <span className="font-mono-num font-bold">+{lastResult.score} points</span> ({lastResult.percentage}%).
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLastResult(null)}
                        className="text-xs font-semibold text-emerald-800 hover:text-emerald-950"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div>
                      <p className="text-xs font-semibold text-blue-800">
                        {course?.code || 'JIT'} Assessment Track
                      </p>
                      <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                        In-App MCQ Exam Center
                      </h2>
                      <p className="text-sm text-slate-600 mt-1.5 max-w-xl">
                        Test your practical knowledge on {course?.name || 'your course'}. Every submitted exam calculates your instant score and adds points directly to your Top Header Exam Points total.
                      </p>
                      <p className="text-xs text-slate-500 mt-2 font-mono-num">
                        Available Bank: {courseQuestions.length} Questions · Total Possible:{' '}
                        {courseQuestions.reduce((acc, q) => acc + q.points, 0)} Pts
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startExam(false)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      Start MCQ Quiz
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </section>

                  {/* Past Exam Submissions */}
                  <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-display text-base font-bold text-slate-900">
                        Completed Exam History
                      </h3>
                      <span className="font-mono-num text-xs font-semibold text-slate-600">
                        Cumulative: {student.examPoints} Points
                      </span>
                    </div>

                    {student.examHistory.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500">
                        You have not submitted an MCQ exam yet. Click "Start MCQ Quiz" above to earn your first points.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                              <th className="py-3 px-6">Assessment Title</th>
                              <th className="py-3 px-6">Date</th>
                              <th className="py-3 px-6 text-right">Score</th>
                              <th className="py-3 px-6 text-right">Percentage</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {[...student.examHistory]
                              .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
                              .map((ex) => (
                                <tr key={ex.id} className="hover:bg-slate-50/70">
                                  <td className="py-3.5 px-6">
                                    <p className="font-medium text-slate-900">{ex.examTitle}</p>
                                    {ex.isMandatoryQuarterly && (
                                      <p className="text-xs text-indigo-700 mt-0.5">
                                        3-Month Mandatory Quarterly Exam
                                      </p>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-6 font-mono-num text-slate-600">
                                    {formatReadableDate(ex.submittedAt)}
                                  </td>
                                  <td className="py-3.5 px-6 text-right font-mono-num font-semibold text-slate-900">
                                    +{ex.score} / {ex.maxScore}
                                  </td>
                                  <td className="py-3.5 px-6 text-right font-mono-num font-semibold text-emerald-700">
                                    {ex.percentage}%
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* TAB 3: COURSES & FEE INQUIRY (NO PUBLIC FEE PRICES) */}
              {activeTab === 'courses' && (
                <div className="space-y-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
                    <h2 className="font-display text-xl font-bold text-slate-900">
                      Institute Course Catalog &amp; Fee Inquiry
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Explore complete syllabi and durations offered at JIT Computer Training Institute. For personalized installment plans and scholarships, contact our office directly.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono-num text-slate-600">
                      <a
                        href={`tel:${data.instituteContact.phone.replace(/\s+/g, '')}`}
                        className="text-blue-900 hover:underline font-semibold"
                      >
                        Call: {data.instituteContact.phone}
                      </a>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <a
                        href={`https://wa.me/${data.instituteContact.whatsapp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        WhatsApp: {data.instituteContact.phone}
                      </a>
                      <span className="text-slate-300" aria-hidden="true">·</span>
                      <a
                        href={`mailto:${data.instituteContact.email}`}
                        className="text-blue-900 hover:underline font-semibold"
                      >
                        {data.instituteContact.email}
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {data.courses.map((c) => {
                      const isCurrent = c.id === student.courseId;
                      const inquiryMsg = `Hello JIT Computer Training Institute, I am ${student.name} (${student.rollId}). I would like to inquire about the fee structure and batch details for ${c.name} (${c.code}).`;
                      return (
                        <article
                          key={c.id}
                          className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                              <span className="font-mono-num font-semibold text-blue-900">
                                {c.code} · {c.duration}
                              </span>
                              {isCurrent && (
                                <span className="font-semibold text-emerald-700">Current Course</span>
                              )}
                            </div>

                            <h3 className="font-display text-lg font-bold text-slate-900 mt-1.5">
                              {c.name}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{c.description}</p>

                            <div className="mt-4 pt-4 border-t border-slate-100">
                              <p className="text-xs font-semibold text-slate-700 mb-2">Syllabus Topics</p>
                              <ul className="space-y-1.5 text-xs text-slate-600">
                                {c.syllabus.map((topic, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="font-mono-num text-slate-400 shrink-0">
                                      {String(i + 1).padStart(2, '0')}.
                                    </span>
                                    <span>{topic}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-2.5">
                            <a
                              href={`tel:${data.instituteContact.phone.replace(/\s+/g, '')}`}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                            >
                              <Phone className="w-4 h-4" />
                              Contact for Fees
                            </a>
                            <a
                              href={buildWhatsAppHref(data.instituteContact.whatsapp, inquiryMsg)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </a>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: MY FEE STATUS & RECEIPTS */}
              {activeTab === 'fees' && (
                <div className="space-y-6">
                  <section className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Current Monthly / Installment Standing</p>
                      <div className="flex items-center gap-2.5 mt-1">
                        {student.feeStatus === 'Paid' ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                        )}
                        <h2
                          className={`font-display text-2xl font-bold ${
                            student.feeStatus === 'Paid' ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          Fee Status: {student.feeStatus}
                        </h2>
                      </div>
                      <p className="text-sm text-slate-600 mt-1.5">
                        {student.feeStatus === 'Paid'
                          ? 'Your current month course installment is marked Paid. Receipts are available below.'
                          : 'Your current installment is marked Due. Please clear it at the institute desk or contact JIT office.'}
                      </p>
                    </div>
                    {student.feeStatus === 'Due' && (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <a
                          href={`tel:${data.instituteContact.phone.replace(/\s+/g, '')}`}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Phone className="w-4 h-4" />
                          Call Accounts Desk
                        </a>
                        <a
                          href={`https://wa.me/${data.instituteContact.whatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </section>

                  <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="font-display text-base font-bold text-slate-900">
                        Payment History &amp; Official Receipts
                      </h3>
                      <span className="font-mono-num text-xs text-slate-500">
                        {student.feeHistory.length} Recorded Payment{student.feeHistory.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    {student.feeHistory.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-500">
                        No payment receipts issued yet. Once JIT Admin records a payment, your printable receipt will appear here.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                              <th className="py-3 px-6">Receipt No.</th>
                              <th className="py-3 px-6">Installment / Month</th>
                              <th className="py-3 px-6">Paid Date</th>
                              <th className="py-3 px-6">Mode</th>
                              <th className="py-3 px-6 text-right">Amount</th>
                              <th className="py-3 px-6 text-right">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-sm">
                            {[...student.feeHistory]
                              .sort((a, b) => b.paidDate.localeCompare(a.paidDate))
                              .map((fp) => (
                                <tr key={fp.id} className="hover:bg-slate-50/70">
                                  <td className="py-3.5 px-6 font-mono-num font-semibold text-slate-900">
                                    {fp.receiptNo}
                                  </td>
                                  <td className="py-3.5 px-6 text-slate-800">{fp.monthLabel}</td>
                                  <td className="py-3.5 px-6 font-mono-num text-slate-600">
                                    {formatReadableDate(fp.paidDate)}
                                  </td>
                                  <td className="py-3.5 px-6 text-slate-600">{fp.paymentMode}</td>
                                  <td className="py-3.5 px-6 text-right font-mono-num font-semibold text-emerald-700">
                                    ₹{fp.amountPaid.toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-3.5 px-6 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedReceipt(fp)}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 hover:text-blue-700 whitespace-nowrap"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      View / Print
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* TAB 5: COURSE COMPLETION CERTIFICATE */}
              {activeTab === 'certificate' && (
                <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
                  {student.courseStatus === 'Completed' ? (
                    <div className="space-y-5">
                      <div className="pb-4 border-b border-slate-200 no-print">
                        <p className="text-xs font-semibold text-emerald-700">Course Completed &amp; Verified</p>
                        <h2 className="font-display text-xl font-bold text-slate-900 mt-1">
                          Official Course Completion Certificate
                        </h2>
                        <p className="text-sm text-slate-600 mt-1">
                          Your official JIT Computer Training Institute certificate is ready. Download as a high-resolution PNG image or print/save as PDF.
                        </p>
                      </div>
                      <CertificateRenderer
                        student={student}
                        course={course}
                        config={data.certificateConfig}
                        onActionSuccess={(msg) => onNotify('success', 'Certificate Ready', msg)}
                      />
                    </div>
                  ) : (
                    <div className="py-10 max-w-lg mx-auto text-center">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
                        <Award className="w-7 h-7" />
                      </div>
                      <h2 className="font-display text-xl font-bold text-slate-900">
                        Certificate Unlocks Upon Course Completion
                      </h2>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        Your current enrollment in <span className="font-semibold text-slate-900">{course?.name}</span> is marked{' '}
                        <span className="font-semibold text-blue-900">Active</span>. Once you finish your training and JIT Admin marks your course as Completed, your personalized certificate will appear here automatically.
                      </p>
                      <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-2 gap-4 text-left text-xs">
                        <div>
                          <p className="text-slate-500">Current Exam Points</p>
                          <p className="font-mono-num text-base font-bold text-slate-900 mt-0.5">
                            {student.examPoints} Pts
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500">Attendance Standing</p>
                          <p className="font-mono-num text-base font-bold text-slate-900 mt-0.5">
                            {attendancePct}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </main>
      </div>

      {/* PRINTABLE FEE RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden print-only-area">
            <div className="px-6 py-4 bg-blue-950 text-white flex items-center justify-between no-print">
              <span className="font-display font-bold text-sm">Official Fee Payment Receipt</span>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                aria-label="Close receipt modal"
                className="p-1 text-blue-200 hover:text-white rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              <div className="text-center pb-4 border-b border-slate-200">
                <img
                  src={INSTITUTE_LOGO_IMAGE}
                  alt="Jharna Institute of Technology (JIT) Official Logo"
                  referrerPolicy="no-referrer"
                  className="h-14 sm:h-16 w-auto object-contain mx-auto mb-2"
                />
                <h3 className="font-display text-lg font-bold text-blue-950">
                  {data.certificateConfig.instituteName}
                </h3>
                <p className="font-mono-num text-xs text-slate-600 mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                  <a
                    href={`tel:${data.instituteContact.phone.replace(/\s+/g, '')}`}
                    className="hover:underline"
                  >
                    {data.instituteContact.phone}
                  </a>
                  <span aria-hidden="true">·</span>
                  <a
                    href={`mailto:${data.instituteContact.email}`}
                    className="hover:underline"
                  >
                    {data.instituteContact.email}
                  </a>
                </p>
                <p className="font-mono-num text-[11px] text-slate-500 mt-0.5">
                  {data.certificateConfig.registrationNo}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs font-mono-num">
                <span>Receipt No: <strong>{selectedReceipt.receiptNo}</strong></span>
                <span>Date: <strong>{formatReadableDate(selectedReceipt.paidDate)}</strong></span>
              </div>

              <div className="space-y-2.5 text-sm border-y border-slate-200 py-4">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Student Name</span>
                  <span className="font-semibold text-slate-900">{student.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Roll ID</span>
                  <span className="font-mono-num font-semibold text-slate-900">{student.rollId}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Course</span>
                  <span className="font-medium text-slate-900 text-right">{course?.name || '—'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Installment Period</span>
                  <span className="font-medium text-slate-900">{selectedReceipt.monthLabel}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Payment Mode</span>
                  <span className="font-medium text-slate-900">{selectedReceipt.paymentMode}</span>
                </div>
                {selectedReceipt.remarks && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Remarks</span>
                    <span className="text-slate-700 text-right">{selectedReceipt.remarks}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 pt-3 border-t border-slate-100 text-base">
                  <span className="font-bold text-slate-900">Amount Received</span>
                  <span className="font-mono-num font-bold text-emerald-700">
                    ₹{selectedReceipt.amountPaid.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <span>Computer-generated receipt · Status: PAID</span>
                <span className="font-semibold text-slate-700">Authorized Signatory</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 no-print">
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    onNotify('info', 'Print Receipt Opened', 'Use your browser print dialog to print or save as PDF.');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
