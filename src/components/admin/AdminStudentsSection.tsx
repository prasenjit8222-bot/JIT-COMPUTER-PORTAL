import React, { useMemo, useState } from 'react';
import {
  UserPlus,
  CheckCircle2,
  XCircle,
  Search,
  Award,
  Clock,
  X,
  Users,
  AlertCircle,
} from 'lucide-react';
import { ALL_DAYS, AppData, DayOfWeek, Student } from '../../types';
import { formatReadableDate, getTodayISO } from '../../utils/helpers';

interface AdminStudentsSectionProps {
  data: AppData;
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
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, description?: string) => void;
}

export const AdminStudentsSection: React.FC<AdminStudentsSectionProps> = ({
  data,
  onApproveStudent,
  onRejectStudent,
  onToggleCourseStatus,
  onDirectAddStudent,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Approved' | 'Pending' | 'Completed'>('all');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Direct Add Student form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [courseId, setCourseId] = useState(data.courses[0]?.id || '');
  const [admissionDate, setAdmissionDate] = useState(getTodayISO());
  const [scheduledDays, setScheduledDays] = useState<DayOfWeek[]>(['Mon', 'Wed', 'Fri']);

  const pendingStudents = useMemo(
    () => data.students.filter((s) => s.approvalStatus === 'Pending'),
    [data.students]
  );

  const approvedStudents = useMemo(
    () => data.students.filter((s) => s.approvalStatus === 'Approved'),
    [data.students]
  );

  const completedCount = useMemo(
    () => approvedStudents.filter((s) => s.courseStatus === 'Completed').length,
    [approvedStudents]
  );

  const dueFeeCount = useMemo(
    () => approvedStudents.filter((s) => s.feeStatus === 'Due').length,
    [approvedStudents]
  );

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.students.filter((s) => {
      if (statusFilter === 'Approved' && s.approvalStatus !== 'Approved') return false;
      if (statusFilter === 'Pending' && s.approvalStatus !== 'Pending') return false;
      if (statusFilter === 'Completed' && s.courseStatus !== 'Completed') return false;

      if (!q) return true;
      const course = data.courses.find((c) => c.id === s.courseId);
      return (
        s.name.toLowerCase().includes(q) ||
        s.rollId.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (course?.name.toLowerCase().includes(q) ?? false) ||
        (course?.code.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data.students, data.courses, search, statusFilter]);

  const toggleDayInForm = (day: DayOfWeek) => {
    setScheduledDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleDirectAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!name.trim() || cleanPhone.length < 10 || !email.trim().includes('@') || !courseId) {
      onNotify(
        'warning',
        'Incomplete Student Details',
        'Please fill Name, 10-digit Contact Number, Email ID, and Course.'
      );
      return;
    }

    onDirectAddStudent({
      name: name.trim(),
      phone: cleanPhone,
      email: email.trim().toLowerCase(),
      courseId,
      admissionDate: admissionDate || getTodayISO(),
      scheduledDays: scheduledDays.length > 0 ? scheduledDays : ['Mon', 'Wed', 'Fri'],
    });

    setName('');
    setPhone('');
    setEmail('');
    setAdmissionDate(getTodayISO());
    setScheduledDays(['Mon', 'Wed', 'Fri']);
    setAddModalOpen(false);
  };

  const getCourseLabel = (cId: string) => {
    const c = data.courses.find((item) => item.id === cId);
    return c ? `${c.code} — ${c.name}` : '—';
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Approved Students</span>
            <Users className="w-4 h-4 text-blue-800" />
          </div>
          <p className="font-mono-num text-2xl font-bold text-blue-950 mt-1.5">{approvedStudents.length}</p>
          <p className="text-xs text-slate-500 mt-1">Active &amp; alumni enrolled</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-mono-num text-2xl font-bold text-amber-700 mt-1.5">{pendingStudents.length}</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting admission review</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Fees Currently Due</span>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="font-mono-num text-2xl font-bold text-red-700 mt-1.5">{dueFeeCount}</p>
          <p className="text-xs text-slate-500 mt-1">Eligible for reminder engine</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Course Completed</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-mono-num text-2xl font-bold text-emerald-700 mt-1.5">{completedCount}</p>
          <p className="text-xs text-slate-500 mt-1">Certificates unlocked</p>
        </div>
      </div>

      {/* PENDING ADMISSION REQUESTS QUEUE */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Pending Admission Requests ({pendingStudents.length})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Approving unlocks the student's portal immediately. Rejecting notifies them to contact the office.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Direct Add Student
          </button>
        </div>

        {pendingStudents.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <p className="font-display font-semibold text-sm text-slate-800">
              No pending admission requests
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              New registration requests submitted by students on the login screen will appear here for your approval.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingStudents.map((st) => (
              <div
                key={st.id}
                className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                    <p className="font-display font-bold text-slate-900">{st.name}</p>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="font-mono-num text-xs text-slate-600">{st.rollId}</span>
                    <span className="text-slate-300" aria-hidden="true">·</span>
                    <span className="text-xs font-semibold text-amber-700">Pending Approval</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 break-words">
                    {getCourseLabel(st.courseId)} · <span className="font-mono-num">{st.phone}</span> · {st.email} · Applied{' '}
                    <span className="font-mono-num">{formatReadableDate(st.admissionDate)}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onApproveStudent(st.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onRejectStudent(st.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FULL STUDENT DIRECTORY & COURSE COMPLETION CONTROL */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 sm:px-6 border-b border-slate-200 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Student Directory &amp; Certificate Unlock
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mark any approved student's course as Completed to immediately unlock their auto-generated certificate.
              </p>
            </div>
          </div>

          {data.students.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone, roll..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit">
                {(['all', 'Approved', 'Pending', 'Completed'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setStatusFilter(tab)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      statusFilter === tab
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'all' ? 'All' : tab}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {data.students.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto mb-3.5">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              No students enrolled yet
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Click &quot;+ Add Student&quot; to enroll your first student directly, or wait for new student registrations from the portal.
            </p>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              + Add Student
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No students match your current search or filter.
          </div>
        ) : (
          <>
            {/* Responsive Stacked Cards (Mobile, Tablet & Narrow Desktop Previews — Zero Horizontal Overflow) */}
            <div className="xl:hidden divide-y divide-slate-100">
              {filteredStudents.map((st: Student) => {
                const c = data.courses.find((item) => item.id === st.courseId);
                return (
                  <div key={st.id} className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-display font-bold text-slate-900">{st.name}</p>
                        <p className="font-mono-num text-xs text-slate-500 mt-0.5">
                          {st.rollId} · {c?.code || '—'} · Admitted {formatReadableDate(st.admissionDate)}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          st.approvalStatus === 'Approved'
                            ? 'text-emerald-700'
                            : st.approvalStatus === 'Pending'
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }`}
                      >
                        {st.approvalStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-3">
                      <div className="min-w-0">
                        <span className="text-slate-400 block">Contact</span>
                        <span className="font-mono-num text-slate-800">{st.phone}</span>
                        <span className="block text-slate-500 truncate">{st.email}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-slate-400 block">Schedule &amp; Exam Points</span>
                        <span className="text-slate-800">{st.scheduledDays.join(', ') || 'No days set'}</span>
                        <span className="block font-mono-num font-semibold text-blue-950">
                          {st.examPoints} Exam Points
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      {st.approvalStatus === 'Approved' ? (
                        <button
                          type="button"
                          onClick={() => onToggleCourseStatus(st.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                            st.courseStatus === 'Completed'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-900'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          {st.courseStatus === 'Completed' ? 'Completed (Cert Live)' : 'Mark Completed'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Requires approval</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clean Well-Spaced Table on Wide Desktop (xl+) */}
            <div className="hidden xl:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-5">Student &amp; Roll ID</th>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Points</th>
                    <th className="py-3 px-5 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredStudents.map((st: Student) => {
                    const c = data.courses.find((item) => item.id === st.courseId);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-5">
                          <p className="font-semibold text-slate-900">{st.name}</p>
                          <p className="font-mono-num text-xs text-slate-500">
                            {st.rollId} · {formatReadableDate(st.admissionDate)}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <p className="font-medium">{c?.code || '—'}</p>
                          <p className="text-xs text-slate-500">{st.scheduledDays.join(', ') || 'No days set'}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-mono-num text-slate-800">{st.phone}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[190px]">{st.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-xs font-semibold ${
                              st.approvalStatus === 'Approved'
                                ? 'text-emerald-700'
                                : st.approvalStatus === 'Pending'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                            }`}
                          >
                            {st.approvalStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-slate-900">
                          {st.examPoints}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {st.approvalStatus === 'Approved' ? (
                            <button
                              type="button"
                              onClick={() => onToggleCourseStatus(st.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                                st.courseStatus === 'Completed'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                  : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-900'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5" />
                              {st.courseStatus === 'Completed' ? 'Completed (Cert Live)' : 'Mark Completed'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">Requires approval</span>
                          )}
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

      {/* DIRECT ADD NEW STUDENT MODAL (AUTO-APPROVED) */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-base">
                  Direct Add New Student (Auto-Approved)
                </h3>
                <p className="text-xs text-slate-500">
                  Immediately enrolls the student with full Student Portal access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                aria-label="Close modal"
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDirectAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aditya Raj"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email ID</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@email.com"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    {data.courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Date</label>
                  <input
                    type="date"
                    required
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Assigned Weekly Class Days (Day-Only)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_DAYS.map((day) => {
                    const active = scheduledDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDayInForm(day)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          active
                            ? 'bg-blue-900 border-blue-900 text-white'
                            : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg"
                >
                  Add &amp; Auto-Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
