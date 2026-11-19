import React, { useMemo, useState } from 'react';
import {
  Users,
  CalendarDays,
  BookOpen,
  ClipboardCheck,
  Smartphone,
  Award,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { INSTITUTE_LOGO_IMAGE } from '../data/seedData';
import {
  AppData,
  CertificateConfig,
  Course,
  DayOfWeek,
  ExamQuestion,
  FeePayment,
} from '../types';
import { AdminStudentsSection } from './admin/AdminStudentsSection';
import { AdminAttendanceSection } from './admin/AdminAttendanceSection';
import { AdminCoursesExamsSection } from './admin/AdminCoursesExamsSection';
import { AdminFeesRemindersSection } from './admin/AdminFeesRemindersSection';
import { AdminCertificateSection } from './admin/AdminCertificateSection';

interface AdminPortalProps {
  data: AppData;
  onLogout: () => void;
  onApproveStudent: (studentId: string) => void;
  onRejectStudent: (studentId: string) => void;
  onToggleCourseStatus: (studentId: string) => void;
  onDirectAddStudent: (payload: {
    name: string;
    phone: string;
    email: string;
    courseId: string;
    admissionDate: string;
    scheduledDays: DayOfWeek[];
  }) => void;
  onUpdateScheduledDays: (studentId: string, days: DayOfWeek[]) => void;
  onMarkAttendance: (studentId: string, date: string, status: 'Present' | 'Absent') => void;
  onSaveCourse: (course: Course, isEdit: boolean) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddQuestion: (question: Omit<ExamQuestion, 'id'>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onTriggerMandatoryExamForCourse: (courseId: string, label: string) => void;
  onToggleStudentMandatoryLock: (studentId: string, lock: boolean, label?: string) => void;
  onToggleFeeStatus: (studentId: string) => void;
  onToggleAutoReminder: (studentId: string) => void;
  onRecordPayment: (studentId: string, payment: Omit<FeePayment, 'id' | 'receiptNo'>) => void;
  onLogSmsReminder: (studentId: string) => void;
  onSendInAppFeeAlert: (studentId: string, message: string) => void;
  onUpdateCertificateConfig: (config: CertificateConfig) => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, description?: string) => void;
}

type AdminTab = 'students' | 'attendance' | 'courses' | 'exams' | 'fees' | 'certificates';

export const AdminPortal: React.FC<AdminPortalProps> = (props) => {
  const { data, onLogout } = props;
  const [activeTab, setActiveTab] = useState<AdminTab>('students');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingCount = useMemo(
    () => data.students.filter((s) => s.approvalStatus === 'Pending').length,
    [data.students]
  );

  const dueReminderCount = useMemo(
    () =>
      data.students.filter(
        (s) => s.approvalStatus === 'Approved' && s.feeStatus === 'Due' && s.autoReminderEnabled
      ).length,
    [data.students]
  );

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      id: 'students',
      label: 'Admissions & Students',
      icon: <Users className="w-4 h-4" />,
      count: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: 'attendance', label: 'Schedule & Attendance', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'courses', label: 'Course Management', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'exams', label: 'MCQ & 3-Month Exams', icon: <ClipboardCheck className="w-4 h-4" /> },
    {
      id: 'fees',
      label: 'Fees & SIM SMS Alerts',
      icon: <Smartphone className="w-4 h-4" />,
      count: dueReminderCount > 0 ? dueReminderCount : undefined,
    },
    { id: 'certificates', label: 'Certificate Template', icon: <Award className="w-4 h-4" /> },
  ];

  const activeTitle = navItems.find((n) => n.id === activeTab)?.label || 'Admin Dashboard';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP BAR */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 no-print">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle admin menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <img
              src={INSTITUTE_LOGO_IMAGE}
              alt="Jharna Institute of Technology (JIT) Official Logo"
              referrerPolicy="no-referrer"
              className="h-10 sm:h-11 w-auto object-contain rounded-md bg-white shrink-0"
            />
            <div className="min-w-0">
              <p className="font-display font-bold text-sm sm:text-base text-slate-900 truncate">
                JHARNA INSTITUTE OF TECHNOLOGY (JIT)
              </p>
              <p className="text-xs text-slate-500 truncate">
                Admin Control Panel · {activeTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER NAV */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1 no-print">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-indigo-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {item.icon}
                  {item.label}
                </span>
                {item.count !== undefined && (
                  <span
                    className={`font-mono-num text-xs font-bold ${
                      isActive ? 'text-indigo-200' : 'text-amber-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* WORKSPACE CANVAS */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 no-print">
          <nav className="sticky top-22 bg-white border border-slate-200 rounded-xl p-2 space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-900 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0 truncate">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.count !== undefined && (
                    <span
                      className={`font-mono-num text-xs font-bold shrink-0 ${
                        isActive ? 'text-indigo-200' : 'text-amber-700'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Quick Horizontal Tab Bar */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-print">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-indigo-900 border-indigo-900 text-white'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                {item.icon}
                {item.label}
                {item.count !== undefined && (
                  <span className={`font-mono-num ml-0.5 ${isActive ? 'text-indigo-200' : 'text-amber-700'}`}>
                    ({item.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0">
          {activeTab === 'students' && (
            <AdminStudentsSection
              data={data}
              onApproveStudent={props.onApproveStudent}
              onRejectStudent={props.onRejectStudent}
              onToggleCourseStatus={props.onToggleCourseStatus}
              onDirectAddStudent={props.onDirectAddStudent}
              onNotify={props.onNotify}
            />
          )}

          {activeTab === 'attendance' && (
            <AdminAttendanceSection
              data={data}
              onUpdateScheduledDays={props.onUpdateScheduledDays}
              onMarkAttendance={props.onMarkAttendance}
            />
          )}

          {activeTab === 'courses' && (
            <AdminCoursesExamsSection
              mode="courses"
              data={data}
              onSaveCourse={props.onSaveCourse}
              onDeleteCourse={props.onDeleteCourse}
              onAddQuestion={props.onAddQuestion}
              onDeleteQuestion={props.onDeleteQuestion}
              onTriggerMandatoryExamForCourse={props.onTriggerMandatoryExamForCourse}
              onToggleStudentMandatoryLock={props.onToggleStudentMandatoryLock}
              onNotify={props.onNotify}
            />
          )}

          {activeTab === 'exams' && (
            <AdminCoursesExamsSection
              mode="exams"
              data={data}
              onSaveCourse={props.onSaveCourse}
              onDeleteCourse={props.onDeleteCourse}
              onAddQuestion={props.onAddQuestion}
              onDeleteQuestion={props.onDeleteQuestion}
              onTriggerMandatoryExamForCourse={props.onTriggerMandatoryExamForCourse}
              onToggleStudentMandatoryLock={props.onToggleStudentMandatoryLock}
              onNotify={props.onNotify}
            />
          )}

          {activeTab === 'fees' && (
            <AdminFeesRemindersSection
              data={data}
              onToggleFeeStatus={props.onToggleFeeStatus}
              onToggleAutoReminder={props.onToggleAutoReminder}
              onRecordPayment={props.onRecordPayment}
              onLogSmsReminder={props.onLogSmsReminder}
              onSendInAppFeeAlert={props.onSendInAppFeeAlert}
            />
          )}

          {activeTab === 'certificates' && (
            <AdminCertificateSection
              data={data}
              onUpdateCertificateConfig={props.onUpdateCertificateConfig}
              onNotify={props.onNotify}
            />
          )}
        </main>
      </div>
    </div>
  );
};
