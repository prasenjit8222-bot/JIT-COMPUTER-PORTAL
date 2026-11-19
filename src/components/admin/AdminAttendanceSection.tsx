import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, XCircle } from 'lucide-react';
import { ALL_DAYS, AppData, DayOfWeek, FULL_DAY_NAMES } from '../../types';
import {
  calculateAttendancePercentage,
  formatReadableDate,
  getDayOfWeekFromDate,
  getTodayISO,
} from '../../utils/helpers';

interface AdminAttendanceSectionProps {
  data: AppData;
  onUpdateScheduledDays: (studentId: string, days: DayOfWeek[]) => void;
  onMarkAttendance: (studentId: string, date: string, status: 'Present' | 'Absent') => void;
}

export const AdminAttendanceSection: React.FC<AdminAttendanceSectionProps> = ({
  data,
  onUpdateScheduledDays,
  onMarkAttendance,
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const selectedDayOfWeek = useMemo(() => getDayOfWeekFromDate(selectedDate), [selectedDate]);
  const [showOnlyScheduledForDay, setShowOnlyScheduledForDay] = useState(false);

  const approvedStudents = useMemo(
    () => data.students.filter((s) => s.approvalStatus === 'Approved'),
    [data.students]
  );

  const visibleStudents = useMemo(() => {
    if (!showOnlyScheduledForDay) return approvedStudents;
    return approvedStudents.filter((s) => s.scheduledDays.includes(selectedDayOfWeek));
  }, [approvedStudents, showOnlyScheduledForDay, selectedDayOfWeek]);

  const toggleStudentDay = (studentId: string, currentDays: DayOfWeek[], day: DayOfWeek) => {
    const next = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];
    // Keep canonical Mon-Sun order
    const ordered = ALL_DAYS.filter((d) => next.includes(d));
    onUpdateScheduledDays(studentId, ordered);
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Selector */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            Weekly Class Schedule &amp; Attendance (Day-Only)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Toggle assigned days (Mon–Sun, no time slots required) and mark Present or Absent for any class date.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <CalendarDays className="w-4 h-4 text-blue-900 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm font-mono-num text-slate-900 bg-transparent focus:outline-none"
            />
            <span className="text-xs font-semibold text-blue-900 border-l border-slate-200 pl-2 whitespace-nowrap">
              {FULL_DAY_NAMES[selectedDayOfWeek]}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowOnlyScheduledForDay((prev) => !prev)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
              showOnlyScheduledForDay
                ? 'bg-blue-900 border-blue-900 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {showOnlyScheduledForDay
              ? `Showing ${selectedDayOfWeek} Batch Only`
              : `Filter by ${selectedDayOfWeek} Scheduled`}
          </button>
        </div>
      </section>

      {/* Student Schedule & Attendance Roster */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {approvedStudents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-6 h-6" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-900">
              No enrolled students yet
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Add a student or approve pending admission requests to assign weekly class days and mark attendance.
            </p>
          </div>
        ) : visibleStudents.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No students scheduled on {FULL_DAY_NAMES[selectedDayOfWeek]}. Toggle the filter off to view all students.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {visibleStudents.map((st) => {
              const course = data.courses.find((c) => c.id === st.courseId);
              const existingRecord = st.attendance.find((a) => a.date === selectedDate);
              const isScheduledToday = st.scheduledDays.includes(selectedDayOfWeek);
              const pct = calculateAttendancePercentage(st);

              return (
                <div
                  key={st.id}
                  className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-slate-50/50"
                >
                  {/* Student Info */}
                  <div className="min-w-0 xl:w-64 shrink-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-slate-900 truncate">{st.name}</p>
                      <span className="font-mono-num text-xs text-slate-500 shrink-0">{st.rollId}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {course?.code || '—'} · Overall Attendance:{' '}
                      <span className="font-mono-num font-semibold text-blue-950">{pct}%</span> (
                      {st.attendance.length} logs)
                    </p>
                  </div>

                  {/* Day-Only Assignment Toggles */}
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                      Assigned Class Days (Click to toggle)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_DAYS.map((day) => {
                        const assigned = st.scheduledDays.includes(day);
                        const isSelectedWeekday = day === selectedDayOfWeek;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleStudentDay(st.id, st.scheduledDays, day)}
                            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                              assigned
                                ? 'bg-blue-900 border-blue-900 text-white'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            } ${isSelectedWeekday ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Attendance Action for Selected Date */}
                  <div className="xl:w-64 shrink-0 flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      {formatReadableDate(selectedDate)} ({selectedDayOfWeek}) ·{' '}
                      <span className={isScheduledToday ? 'text-blue-800 font-semibold' : 'text-slate-400'}>
                        {isScheduledToday ? 'Scheduled Day' : 'Off Day'}
                      </span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onMarkAttendance(st.id, selectedDate, 'Present')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                          existingRecord?.status === 'Present'
                            ? 'bg-emerald-700 border-emerald-700 text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-400 hover:text-emerald-800'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => onMarkAttendance(st.id, selectedDate, 'Absent')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                          existingRecord?.status === 'Absent'
                            ? 'bg-red-700 border-red-700 text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-red-400 hover:text-red-800'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Absent
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
