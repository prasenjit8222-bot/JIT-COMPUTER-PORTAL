import React, { useMemo, useState } from 'react';
import {
  Smartphone,
  BellRing,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  IndianRupee,
  X,
  Receipt,
} from 'lucide-react';
import { AppData, FeePayment, Student } from '../../types';
import {
  buildFeeReminderMessage,
  buildSmsHref,
  formatReadableDate,
  getNextReminderCycleDay,
  getTodayISO,
  isReminderCycleDay,
  REMINDER_CYCLE_DAYS,
} from '../../utils/helpers';

interface AdminFeesRemindersSectionProps {
  data: AppData;
  onToggleFeeStatus: (studentId: string) => void;
  onToggleAutoReminder: (studentId: string) => void;
  onRecordPayment: (
    studentId: string,
    payment: Omit<FeePayment, 'id' | 'receiptNo'>
  ) => void;
  onLogSmsReminder: (studentId: string) => void;
  onSendInAppFeeAlert: (studentId: string, message: string) => void;
}

export const AdminFeesRemindersSection: React.FC<AdminFeesRemindersSectionProps> = ({
  data,
  onToggleFeeStatus,
  onToggleAutoReminder,
  onRecordPayment,
  onLogSmsReminder,
  onSendInAppFeeAlert,
}) => {
  const actualDayOfMonth = new Date().getDate();
  const [simulatedDay, setSimulatedDay] = useState<number>(
    actualDayOfMonth > 10 ? actualDayOfMonth : 14
  );

  // Payment Recording Modal state
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [monthLabel, setMonthLabel] = useState('November 2026');
  const [amountPaid, setAmountPaid] = useState('1500');
  const [paymentMode, setPaymentMode] = useState<FeePayment['paymentMode']>('UPI');
  const [remarks, setRemarks] = useState('');

  const approvedStudents = useMemo(
    () => data.students.filter((s) => s.approvalStatus === 'Approved'),
    [data.students]
  );

  const paidCount = useMemo(
    () => approvedStudents.filter((s) => s.feeStatus === 'Paid').length,
    [approvedStudents]
  );

  const dueCount = useMemo(
    () => approvedStudents.filter((s) => s.feeStatus === 'Due').length,
    [approvedStudents]
  );

  const totalCollected = useMemo(
    () =>
      approvedStudents.reduce(
        (sum, s) => sum + s.feeHistory.reduce((acc, p) => acc + p.amountPaid, 0),
        0
      ),
    [approvedStudents]
  );

  const isAfterTenth = simulatedDay > 10;
  const isCycleTriggerDay = isReminderCycleDay(simulatedDay);
  const nextCycleDay = getNextReminderCycleDay(simulatedDay);

  // Smart Auto-Stop: automatically excludes students marked Paid OR with Auto-Reminder OFF
  const todaysDueReminders = useMemo(() => {
    if (!isAfterTenth) return [];
    return approvedStudents.filter((s) => s.feeStatus === 'Due' && s.autoReminderEnabled);
  }, [approvedStudents, isAfterTenth]);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentStudent) return;
    const numericAmt = Math.max(1, Number(amountPaid) || 0);
    onRecordPayment(paymentStudent.id, {
      monthLabel: monthLabel.trim() || 'Monthly Installment',
      amountPaid: numericAmt,
      paidDate: getTodayISO(),
      paymentMode,
      remarks: remarks.trim() || undefined,
    });
    setPaymentStudent(null);
    setRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* Clean Fee Summary Placeholder (Phase 2 accounting note) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Fee Status Summary</p>
          <p className="font-mono-num text-2xl font-bold text-slate-900 mt-1">
            {paidCount} Paid <span className="text-slate-300 font-normal">/</span>{' '}
            <span className="text-red-700">{dueCount} Due</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Approved students this month</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Recorded Receipts Total</p>
          <p className="font-mono-num text-2xl font-bold text-emerald-700 mt-1">
            ₹{totalCollected.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500 mt-1">From issued student fee receipts</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Accounts &amp; Ledger Roadmap</p>
          <p className="font-display text-sm font-bold text-indigo-950 mt-1.5">
            Fee Summary Active · Phase 2 Accounting Ready
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Full expense &amp; GST accounting module will expand in Phase 2.
          </p>
        </div>
      </div>

      {/* AUTOMATED 10TH-OF-MONTH + 3-DAY INTERVAL REMINDER ENGINE */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800">
                <CalendarClock className="w-4 h-4" />
                <span>Automated 10th-of-Month + 3-Day Interval Engine</span>
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900 mt-1">
                Today's Due Reminders ({todaysDueReminders.length})
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Automatically filters Due students after the 10th (11th, 14th, 17th, 20th, 23rd, 26th, 29th) with Auto-Reminder ON. Paid students are auto-excluded.
              </p>
            </div>

            {/* Day-of-Month Cycle Selector for Instant Admin Verification */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2">
              <span className="text-[11px] font-semibold text-slate-500 px-1.5">Day of Month:</span>
              <button
                type="button"
                onClick={() => setSimulatedDay(actualDayOfMonth)}
                className={`px-2.5 py-1 text-xs font-mono-num font-semibold rounded-md transition-colors ${
                  simulatedDay === actualDayOfMonth
                    ? 'bg-blue-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Today ({actualDayOfMonth})
              </button>
              <button
                type="button"
                onClick={() => setSimulatedDay(8)}
                className={`px-2.5 py-1 text-xs font-mono-num font-semibold rounded-md transition-colors ${
                  simulatedDay === 8
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                8th (Grace)
              </button>
              {REMINDER_CYCLE_DAYS.slice(0, 5).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSimulatedDay(d)}
                  className={`px-2 py-1 text-xs font-mono-num font-semibold rounded-md transition-colors ${
                    simulatedDay === d
                      ? 'bg-indigo-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d}th
                </button>
              ))}
            </div>
          </div>

          {/* Cycle Status Line */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
            <span>
              Viewing schedule for <strong className="font-mono-num text-slate-900">Day {simulatedDay}</strong> of month:{' '}
              {!isAfterTenth ? (
                <span className="text-emerald-700 font-semibold">
                  Within 1st–10th grace period (Reminders activate on 11th)
                </span>
              ) : isCycleTriggerDay ? (
                <span className="text-indigo-800 font-semibold">
                  Active 3-Day Reminder Cycle Day — Ready to dispatch SIM SMS &amp; In-App alerts
                </span>
              ) : (
                <span className="text-amber-700 font-semibold">
                  Past 10th (Next 3-day trigger is the {nextCycleDay}th — manual send still available below)
                </span>
              )}
            </span>
            <span className="font-mono-num text-slate-500">
              Cycle Days: {REMINDER_CYCLE_DAYS.map((d) => `${d}th`).join(' · ')}
            </span>
          </div>
        </div>

        {/* Eligible Reminders List */}
        {approvedStudents.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-5 h-5" />
            </div>
            <p className="font-display font-semibold text-sm text-slate-800">
              No due reminders queued
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Once students are enrolled, anyone with a Due fee after the 10th of the month will automatically appear here for one-tap SIM SMS dispatch.
            </p>
          </div>
        ) : !isAfterTenth ? (
          <div className="p-8 text-center text-sm text-slate-600">
            No reminders queued during the 1st–10th grace period. Switch to any reminder cycle day (11th, 14th, 17th, 20th) above to inspect and send reminders.
          </div>
        ) : todaysDueReminders.length === 0 ? (
          <div className="p-8 text-center text-sm text-emerald-700 font-medium">
            All due students are either marked Paid (auto-stopped) or have individual Auto-Reminder paused.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todaysDueReminders.map((st) => {
              const message = buildFeeReminderMessage(st.name);
              const smsHref = buildSmsHref(st.phone, message);
              const course = data.courses.find((c) => c.id === st.courseId);

              return (
                <div key={st.id} className="p-5 sm:p-6 space-y-3.5 hover:bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-bold text-slate-900">{st.name}</h3>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="font-mono-num text-xs text-slate-600">{st.rollId}</span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="font-mono-num text-xs font-semibold text-blue-900">{st.phone}</span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="text-xs text-slate-600">{course?.code}</span>
                      </div>
                      {st.lastReminderSentAt && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Last reminder sent: <span className="font-mono-num">{st.lastReminderSentAt}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={smsHref}
                        onClick={() => onLogSmsReminder(st.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Smartphone className="w-4 h-4" />
                        Send via SIM (SMS)
                      </a>
                      <button
                        type="button"
                        onClick={() => onSendInAppFeeAlert(st.id, message)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <BellRing className="w-4 h-4" />
                        In-App Push Alert
                      </button>
                    </div>
                  </div>

                  {/* Respectful Pre-Filled SMS Message Preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Pre-filled SIM SMS Template:
                    </span>
                    “{message}”
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ALL STUDENTS FEE STATUS & INDIVIDUAL AUTO-REMINDER TOGGLE LIST */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 sm:px-6 border-b border-slate-200">
          <h2 className="font-display text-lg font-bold text-slate-900">
            Student Fee Status &amp; Smart Auto-Stop Controls
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Marking a student Paid automatically stops SMS reminders. Use the individual switch to pause reminders for any specific student at any time.
          </p>
        </div>

        {approvedStudents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              No student fee records yet
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Enroll or approve students in the Admissions &amp; Students tab to track monthly fee status, issue receipts, and manage auto-reminders.
            </p>
          </div>
        ) : (
          <>
            {/* Responsive Cards (< xl) — Zero Horizontal Overflow */}
            <div className="xl:hidden divide-y divide-slate-100">
              {approvedStudents.map((st) => {
                const course = data.courses.find((c) => c.id === st.courseId);
                const isPaid = st.feeStatus === 'Paid';
                return (
                  <div key={st.id} className="p-4 sm:p-5 space-y-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display font-bold text-slate-900">{st.name}</p>
                        <p className="font-mono-num text-xs text-slate-500 mt-0.5">
                          {st.rollId} · {course?.code || '—'} · {st.phone}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          isPaid ? 'text-emerald-700' : 'text-red-700'
                        }`}
                      >
                        {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {st.feeStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-lg px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={st.autoReminderEnabled && !isPaid}
                          disabled={isPaid}
                          onClick={() => onToggleAutoReminder(st.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isPaid
                              ? 'bg-slate-200 cursor-not-allowed'
                              : st.autoReminderEnabled
                                ? 'bg-emerald-600'
                                : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              !isPaid && st.autoReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-xs text-slate-600">
                          {isPaid
                            ? 'Auto-Stopped (Paid)'
                            : st.autoReminderEnabled
                              ? 'Auto-Reminder ON'
                              : 'Auto-Reminder OFF'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentStudent(st);
                            setAmountPaid('1500');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Record Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleFeeStatus(st.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Mark {isPaid ? 'Due' : 'Paid'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clean Table (xl+) */}
            <div className="hidden xl:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-5">Student</th>
                    <th className="py-3 px-4">Course &amp; Phone</th>
                    <th className="py-3 px-4">Fee Status</th>
                    <th className="py-3 px-4">Auto-Reminder</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {approvedStudents.map((st) => {
                    const course = data.courses.find((c) => c.id === st.courseId);
                    const isPaid = st.feeStatus === 'Paid';
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-5">
                          <p className="font-semibold text-slate-900">{st.name}</p>
                          <p className="font-mono-num text-xs text-slate-500">
                            {st.rollId} · {st.feeHistory.length} receipt{st.feeHistory.length === 1 ? '' : 's'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-slate-800 font-medium">{course?.code || '—'}</p>
                          <p className="font-mono-num text-xs text-slate-500">{st.phone}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              isPaid ? 'text-emerald-700' : 'text-red-700'
                            }`}
                          >
                            {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {st.feeStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={st.autoReminderEnabled && !isPaid}
                              disabled={isPaid}
                              onClick={() => onToggleAutoReminder(st.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                isPaid
                                  ? 'bg-slate-200 cursor-not-allowed'
                                  : st.autoReminderEnabled
                                    ? 'bg-emerald-600'
                                    : 'bg-slate-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  !isPaid && st.autoReminderEnabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            <span className="text-xs text-slate-600 whitespace-nowrap">
                              {isPaid
                                ? 'Auto-Stopped (Paid)'
                                : st.autoReminderEnabled
                                  ? 'Active (ON)'
                                  : 'Paused (OFF)'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentStudent(st);
                                setAmountPaid('1500');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Record Payment
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleFeeStatus(st.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
                            >
                              Mark {isPaid ? 'Due' : 'Paid'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* RECORD PAYMENT & ISSUE RECEIPT MODAL */}
      {paymentStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-900">Record Fee Payment</h3>
                <p className="text-xs text-slate-500">
                  {paymentStudent.name} · {paymentStudent.rollId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentStudent(null)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Installment / Month Label
                </label>
                <input
                  type="text"
                  required
                  value={monthLabel}
                  onChange={(e) => setMonthLabel(e.target.value)}
                  placeholder="e.g. November 2026"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR)</label>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      required
                      min={1}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as FeePayment['paymentMode'])}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks (Optional)</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Paid via UPI Ref #8821"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <p className="text-xs text-slate-500">
                Recording this payment marks the student <strong>Paid</strong>, generates a printable receipt on {formatReadableDate(getTodayISO())}, and auto-stops due reminders.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentStudent(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                >
                  Issue Receipt &amp; Mark Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
