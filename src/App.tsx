import { useCallback, useEffect, useState } from 'react';
import {
  AppData,
  AuthSession,
  CertificateConfig,
  Course,
  DayOfWeek,
  ExamQuestion,
  ExamSubmission,
  FeePayment,
  Student,
  ToastMessage,
} from './types';
import {
  generateReceiptNo,
  generateRollId,
  getDayOfWeekFromDate,
  getTodayISO,
  loadAppData,
  saveAppData,
} from './utils/helpers';
import { AuthScreen } from './components/AuthScreen';
import { StudentPortal } from './components/StudentPortal';
import { AdminPortal } from './components/AdminPortal';
import { ToastContainer } from './components/ToastContainer';

export default function App() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [session, setSession] = useState<AuthSession>({ role: 'guest' });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist every update to LocalStorage automatically
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // --- STUDENT REGISTRATION & EXAM ACTIONS ---
  const handleNewAdmissionRequest = (payload: {
    name: string;
    phone: string;
    email: string;
    courseId: string;
  }): Student => {
    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      rollId: generateRollId(data.students),
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      courseId: payload.courseId,
      admissionDate: getTodayISO(),
      approvalStatus: 'Pending',
      courseStatus: 'Active',
      scheduledDays: ['Mon', 'Wed', 'Fri'],
      attendance: [],
      feeStatus: 'Due',
      autoReminderEnabled: true,
      feeHistory: [],
      examPoints: 0,
      examHistory: [],
      mandatoryExamDue: false,
      notifications: [
        {
          id: `not-${Date.now()}`,
          title: 'Admission Request Received',
          message: 'Your admission request has been submitted and awaits JIT Admin approval.',
          date: getTodayISO(),
          type: 'notice',
          read: false,
        },
      ],
    };

    setData((prev) => ({
      ...prev,
      students: [newStudent, ...prev.students],
    }));

    return newStudent;
  };

  const handleSubmitExam = (
    studentId: string,
    submission: ExamSubmission,
    unlockMandatory: boolean
  ) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) => {
        if (st.id !== studentId) return st;
        return {
          ...st,
          examPoints: st.examPoints + submission.score,
          examHistory: [submission, ...st.examHistory],
          mandatoryExamDue: unlockMandatory ? false : st.mandatoryExamDue,
          lastQuarterlyExamDate: unlockMandatory ? submission.submittedAt : st.lastQuarterlyExamDate,
          notifications: [
            {
              id: `not-${Date.now()}`,
              title: `Exam Completed (+${submission.score} Points)`,
              message: `Scored ${submission.score}/${submission.maxScore} (${submission.percentage}%) in ${submission.examTitle}.`,
              date: submission.submittedAt,
              type: 'exam',
              read: false,
            },
            ...st.notifications,
          ],
        };
      }),
    }));
  };

  const handleMarkNotificationsRead = (studentId: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId
          ? { ...st, notifications: st.notifications.map((n) => ({ ...n, read: true })) }
          : st
      ),
    }));
  };

  // --- ADMIN ACTIONS ---
  const handleApproveStudent = (studentId: string) => {
    const target = data.students.find((s) => s.id === studentId);
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId
          ? {
              ...st,
              approvalStatus: 'Approved',
              notifications: [
                {
                  id: `not-${Date.now()}`,
                  title: 'Admission Approved — Welcome to JIT!',
                  message: `Your admission (${st.rollId}) has been approved by JIT Admin. Your full Student Portal is now active.`,
                  date: getTodayISO(),
                  type: 'notice',
                  read: false,
                },
                ...st.notifications,
              ],
            }
          : st
      ),
    }));
    addToast(
      'success',
      `Approved ${target?.name || 'Student'}`,
      'Student Portal access is now unlocked for this student.'
    );
  };

  const handleRejectStudent = (studentId: string) => {
    const target = data.students.find((s) => s.id === studentId);
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId ? { ...st, approvalStatus: 'Rejected' } : st
      ),
    }));
    addToast('warning', `Rejected ${target?.name || 'Applicant'}`, 'Admission request marked Rejected.');
  };

  const handleDirectAddStudent = (payload: {
    name: string;
    phone: string;
    email: string;
    courseId: string;
    admissionDate: string;
    scheduledDays: DayOfWeek[];
  }) => {
    const rollId = generateRollId(data.students);
    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      rollId,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      courseId: payload.courseId,
      admissionDate: payload.admissionDate,
      approvalStatus: 'Approved',
      courseStatus: 'Active',
      scheduledDays: payload.scheduledDays,
      attendance: [],
      feeStatus: 'Due',
      autoReminderEnabled: true,
      feeHistory: [],
      examPoints: 0,
      examHistory: [],
      mandatoryExamDue: false,
      notifications: [
        {
          id: `not-${Date.now()}`,
          title: 'Welcome to JIT Computer Training Institute',
          message: `You have been enrolled by JIT Admin with Roll ID ${rollId}. Assigned class days: ${payload.scheduledDays.join(', ')}.`,
          date: getTodayISO(),
          type: 'notice',
          read: false,
        },
      ],
    };

    setData((prev) => ({
      ...prev,
      students: [newStudent, ...prev.students],
    }));

    addToast(
      'success',
      `Student Added (${rollId})`,
      `${payload.name} has been auto-approved and can log in immediately.`
    );
  };

  const handleToggleCourseStatus = (studentId: string) => {
    const target = data.students.find((s) => s.id === studentId);
    if (!target) return;
    const nextStatus = target.courseStatus === 'Completed' ? 'Active' : 'Completed';
    const today = getTodayISO();

    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) => {
        if (st.id !== studentId) return st;
        return {
          ...st,
          courseStatus: nextStatus,
          completionDate: nextStatus === 'Completed' ? today : undefined,
          mandatoryExamDue: nextStatus === 'Completed' ? false : st.mandatoryExamDue,
          notifications:
            nextStatus === 'Completed'
              ? [
                  {
                    id: `not-${Date.now()}`,
                    title: 'Course Completion Certificate Unlocked',
                    message: `Congratulations ${st.name}! Your course is marked Completed. Download your official certificate now.`,
                    date: today,
                    type: 'certificate',
                    read: false,
                  },
                  ...st.notifications,
                ]
              : st.notifications,
        };
      }),
    }));

    addToast(
      'success',
      nextStatus === 'Completed'
        ? `Certificate Unlocked for ${target.name}`
        : `${target.name} set back to Active`,
      nextStatus === 'Completed'
        ? 'Student can now view, print, and download their auto-generated certificate.'
        : 'Course status returned to Active.'
    );
  };

  const handleUpdateScheduledDays = (studentId: string, days: DayOfWeek[]) => {
    const target = data.students.find((s) => s.id === studentId);
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId ? { ...st, scheduledDays: days } : st
      ),
    }));
    addToast(
      'info',
      `Schedule Updated — ${target?.name || 'Student'}`,
      days.length > 0 ? `Assigned days: ${days.join(', ')}` : 'All class days cleared.'
    );
  };

  const handleMarkAttendance = (
    studentId: string,
    date: string,
    status: 'Present' | 'Absent'
  ) => {
    const target = data.students.find((s) => s.id === studentId);
    const day = getDayOfWeekFromDate(date);
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) => {
        if (st.id !== studentId) return st;
        const exists = st.attendance.some((a) => a.date === date);
        const updatedAttendance = exists
          ? st.attendance.map((a) => (a.date === date ? { ...a, status, day } : a))
          : [{ id: `att-${Date.now()}`, date, day, status }, ...st.attendance];
        return { ...st, attendance: updatedAttendance };
      }),
    }));
    addToast('success', `Marked ${status}`, `${target?.name || 'Student'} marked ${status} for ${date}.`);
  };

  const handleSaveCourse = (course: Course, isEdit: boolean) => {
    setData((prev) => ({
      ...prev,
      courses: isEdit
        ? prev.courses.map((c) => (c.id === course.id ? course : c))
        : [...prev.courses, course],
    }));
    addToast(
      'success',
      isEdit ? `Updated ${course.code}` : `Added Course ${course.code}`,
      `${course.name} (${course.duration}) saved.`
    );
  };

  const handleDeleteCourse = (courseId: string) => {
    const target = data.courses.find((c) => c.id === courseId);
    if (data.courses.length <= 1) {
      addToast('warning', 'Cannot Delete Last Course', 'Keep at least one active course in the institute catalog.');
      return;
    }
    setData((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== courseId),
      questions: prev.questions.filter((q) => q.courseId !== courseId),
    }));
    addToast('info', `Deleted ${target?.name || 'Course'}`, 'Removed from institute course catalog.');
  };

  const handleAddQuestion = (question: Omit<ExamQuestion, 'id'>) => {
    const newQ: ExamQuestion = { ...question, id: `q-${Date.now()}` };
    setData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
    addToast('success', 'MCQ Question Added', 'Now active in student quizzes and 3-month mandatory exams.');
  };

  const handleDeleteQuestion = (questionId: string) => {
    setData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
    addToast('info', 'Question Removed', 'Deleted from course MCQ bank.');
  };

  const handleTriggerMandatoryExamForCourse = (courseId: string, label: string) => {
    const course = data.courses.find((c) => c.id === courseId);
    let affected = 0;
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) => {
        if (
          st.courseId === courseId &&
          st.approvalStatus === 'Approved' &&
          st.courseStatus === 'Active'
        ) {
          affected += 1;
          return {
            ...st,
            mandatoryExamDue: true,
            mandatoryExamLabel: label,
            notifications: [
              {
                id: `not-${Date.now()}-${st.id}`,
                title: 'Quarterly Mandatory Exam Assigned',
                message: `${label} is now active. Please complete the in-app MCQ exam to unlock your dashboard.`,
                date: getTodayISO(),
                type: 'exam',
                read: false,
              },
              ...st.notifications,
            ],
          };
        }
        return st;
      }),
    }));

    addToast(
      affected > 0 ? 'success' : 'info',
      affected > 0
        ? `Mandatory Exam Triggered (${affected} Student${affected === 1 ? '' : 's'})`
        : 'No Active Students in Course',
      affected > 0
        ? `Locked active ${course?.code || ''} portals until they complete "${label}".`
        : `No active approved students are currently enrolled in ${course?.name || 'this course'}.`
    );
  };

  const handleToggleStudentMandatoryLock = (studentId: string, lock: boolean, label?: string) => {
    const target = data.students.find((s) => s.id === studentId);
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) => {
        if (st.id !== studentId) return st;
        return {
          ...st,
          mandatoryExamDue: lock,
          mandatoryExamLabel: lock ? label || '3-Month Mandatory Quarterly Exam' : st.mandatoryExamLabel,
          lastQuarterlyExamDate: lock ? st.lastQuarterlyExamDate : getTodayISO(),
        };
      }),
    }));
    addToast(
      lock ? 'warning' : 'success',
      lock ? `Mandatory Lock Enabled — ${target?.name}` : `Lock Cleared — ${target?.name}`,
      lock
        ? 'Student must complete their MCQ test on next login.'
        : 'Student dashboard access restored.'
    );
  };

  const handleToggleFeeStatus = (studentId: string) => {
    const target = data.students.find((s) => s.id === studentId);
    if (!target) return;
    const nextFeeStatus = target.feeStatus === 'Paid' ? 'Due' : 'Paid';

    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId ? { ...st, feeStatus: nextFeeStatus } : st
      ),
    }));

    addToast(
      nextFeeStatus === 'Paid' ? 'success' : 'warning',
      `${target.name} Marked ${nextFeeStatus}`,
      nextFeeStatus === 'Paid'
        ? 'Smart Auto-Stop activated — student removed from Due Reminders.'
        : 'Student added to Due Fee Reminders if Auto-Reminder is ON.'
    );
  };

  const handleToggleAutoReminder = (studentId: string) => {
    const target = data.students.find((s) => s.id === studentId);
    if (!target) return;
    const nextVal = !target.autoReminderEnabled;
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId ? { ...st, autoReminderEnabled: nextVal } : st
      ),
    }));
    addToast(
      'info',
      `Auto-Reminder ${nextVal ? 'ON' : 'OFF'} — ${target.name}`,
      nextVal
        ? 'Student will appear in Due Reminders after the 10th of the month.'
        : 'Reminders paused for this student.'
    );
  };

  const handleRecordPayment = (
    studentId: string,
    payment: Omit<FeePayment, 'id' | 'receiptNo'>
  ) => {
    const target = data.students.find((s) => s.id === studentId);
    const receiptNo = generateReceiptNo(data.students);
    const newPayment: FeePayment = {
      ...payment,
      id: `fee-${Date.now()}`,
      receiptNo,
    };

    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) => {
        if (st.id !== studentId) return st;
        return {
          ...st,
          feeStatus: 'Paid',
          feeHistory: [newPayment, ...st.feeHistory],
          notifications: [
            {
              id: `not-${Date.now()}`,
              title: `Fee Receipt Issued (${receiptNo})`,
              message: `Payment of ₹${payment.amountPaid.toLocaleString('en-IN')} for ${payment.monthLabel} via ${payment.paymentMode} has been marked Paid.`,
              date: payment.paidDate,
              type: 'fee',
              read: false,
            },
            ...st.notifications,
          ],
        };
      }),
    }));

    addToast(
      'success',
      `Receipt ${receiptNo} Issued`,
      `${target?.name || 'Student'} marked Paid & SMS reminders auto-stopped.`
    );
  };

  const handleLogSmsReminder = (studentId: string) => {
    const target = data.students.find((s) => s.id === studentId);
    const stamp = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId ? { ...st, lastReminderSentAt: stamp } : st
      ),
    }));
    addToast(
      'success',
      `SIM SMS App Opened for ${target?.name || 'Student'}`,
      `Pre-filled respectful fee reminder ready to send to ${target?.phone || ''}.`
    );
  };

  const handleSendInAppFeeAlert = (studentId: string, message: string) => {
    const target = data.students.find((s) => s.id === studentId);
    const stamp = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    setData((prev) => ({
      ...prev,
      students: prev.students.map((st) =>
        st.id === studentId
          ? {
              ...st,
              lastReminderSentAt: stamp,
              notifications: [
                {
                  id: `not-${Date.now()}`,
                  title: 'Gentle Fee Reminder — JIT Accounts',
                  message,
                  date: getTodayISO(),
                  type: 'fee',
                  read: false,
                },
                ...st.notifications,
              ],
            }
          : st
      ),
    }));
    addToast(
      'success',
      `In-App Alert Sent to ${target?.name || 'Student'}`,
      'Alert is now live inside their Student Portal notification bell.'
    );
  };

  const handleUpdateCertificateConfig = (config: CertificateConfig) => {
    setData((prev) => ({ ...prev, certificateConfig: config }));
    addToast(
      'success',
      'Certificate Template Saved',
      'All completed student certificates now reflect your updated design.'
    );
  };

  const activeStudent =
    session.role === 'student'
      ? data.students.find((s) => s.id === session.studentId)
      : undefined;

  return (
    <>
      {session.role === 'admin' ? (
        <AdminPortal
          data={data}
          onLogout={() => {
            setSession({ role: 'guest' });
            addToast('info', 'Signed Out', 'You have exited the JIT Admin Console.');
          }}
          onApproveStudent={handleApproveStudent}
          onRejectStudent={handleRejectStudent}
          onToggleCourseStatus={handleToggleCourseStatus}
          onDirectAddStudent={handleDirectAddStudent}
          onUpdateScheduledDays={handleUpdateScheduledDays}
          onMarkAttendance={handleMarkAttendance}
          onSaveCourse={handleSaveCourse}
          onDeleteCourse={handleDeleteCourse}
          onAddQuestion={handleAddQuestion}
          onDeleteQuestion={handleDeleteQuestion}
          onTriggerMandatoryExamForCourse={handleTriggerMandatoryExamForCourse}
          onToggleStudentMandatoryLock={handleToggleStudentMandatoryLock}
          onToggleFeeStatus={handleToggleFeeStatus}
          onToggleAutoReminder={handleToggleAutoReminder}
          onRecordPayment={handleRecordPayment}
          onLogSmsReminder={handleLogSmsReminder}
          onSendInAppFeeAlert={handleSendInAppFeeAlert}
          onUpdateCertificateConfig={handleUpdateCertificateConfig}
          onNotify={addToast}
        />
      ) : session.role === 'student' && activeStudent && activeStudent.approvalStatus === 'Approved' ? (
        <StudentPortal
          data={data}
          student={activeStudent}
          onLogout={() => {
            setSession({ role: 'guest' });
            addToast('info', 'Signed Out', 'Returned to JIT Computer Training Institute Login.');
          }}
          onSubmitExam={handleSubmitExam}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          onNotify={addToast}
        />
      ) : (
        <AuthScreen
          data={data}
          onStudentLoginSuccess={(studentId) => setSession({ role: 'student', studentId })}
          onAdminLoginSuccess={() => setSession({ role: 'admin', username: '8017462677' })}
          onNewAdmissionRequest={handleNewAdmissionRequest}
          onNotify={addToast}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
