import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Lock, Unlock, ClipboardCheck, BookOpen, X } from 'lucide-react';
import { AppData, Course, ExamQuestion } from '../../types';
import { isStudentLockedByMandatoryExam } from '../../utils/helpers';

interface AdminCoursesExamsSectionProps {
  mode: 'courses' | 'exams';
  data: AppData;
  onSaveCourse: (course: Course, isEdit: boolean) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddQuestion: (question: Omit<ExamQuestion, 'id'>) => void;
  onDeleteQuestion: (questionId: string) => void;
  onTriggerMandatoryExamForCourse: (courseId: string, label: string) => void;
  onToggleStudentMandatoryLock: (studentId: string, lock: boolean, label?: string) => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, description?: string) => void;
}

export const AdminCoursesExamsSection: React.FC<AdminCoursesExamsSectionProps> = ({
  mode,
  data,
  onSaveCourse,
  onDeleteCourse,
  onAddQuestion,
  onDeleteQuestion,
  onTriggerMandatoryExamForCourse,
  onToggleStudentMandatoryLock,
  onNotify,
}) => {
  // Course Form Modal State
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [cCode, setCCode] = useState('');
  const [cName, setCName] = useState('');
  const [cDuration, setCDuration] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cSyllabusText, setCSyllabusText] = useState('');

  // Exam Management State
  const [selectedCourseId, setSelectedCourseId] = useState(data.courses[0]?.id || '');
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [points, setPoints] = useState(25);
  const [quarterLabel, setQuarterLabel] = useState('3-Month Mandatory Quarterly Exam (Q4 2026)');

  const filteredQuestions = useMemo(
    () => data.questions.filter((q) => q.courseId === selectedCourseId),
    [data.questions, selectedCourseId]
  );

  const approvedStudents = useMemo(
    () => data.students.filter((s) => s.approvalStatus === 'Approved'),
    [data.students]
  );

  const openNewCourseModal = () => {
    setEditingCourseId(null);
    setCCode('');
    setCName('');
    setCDuration('');
    setCDesc('');
    setCSyllabusText('');
    setCourseModalOpen(true);
  };

  const openEditCourseModal = (course: Course) => {
    setEditingCourseId(course.id);
    setCCode(course.code);
    setCName(course.name);
    setCDuration(course.duration);
    setCDesc(course.description);
    setCSyllabusText(course.syllabus.join('\n'));
    setCourseModalOpen(true);
  };

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const topics = cSyllabusText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (!cCode.trim() || !cName.trim() || !cDuration.trim() || topics.length === 0) {
      onNotify(
        'warning',
        'Complete Course Information',
        'Enter course code, name, duration, and at least one syllabus topic.'
      );
      return;
    }

    onSaveCourse(
      {
        id: editingCourseId || `course-${Date.now()}`,
        code: cCode.trim().toUpperCase(),
        name: cName.trim(),
        duration: cDuration.trim(),
        description: cDesc.trim() || 'Practical hands-on computer training course.',
        syllabus: topics,
      },
      Boolean(editingCourseId)
    );
    setCourseModalOpen(false);
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      onNotify('warning', 'Complete Question & All 4 Options', 'Every MCQ requires a question and 4 answer choices.');
      return;
    }

    onAddQuestion({
      courseId: selectedCourseId,
      question: qText.trim(),
      options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
      correctIndex: correctIdx,
      points: Math.max(5, Number(points) || 20),
    });

    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectIdx(0);
  };

  if (mode === 'courses') {
    return (
      <div className="space-y-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Institute Courses &amp; Syllabus Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage course duration and syllabus topics. Fees remain private behind "Contact for Fees" in the Student Portal.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewCourseModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add New Course
          </button>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.courses.map((course) => {
            const enrolledCount = data.students.filter((s) => s.courseId === course.id).length;
            const qCount = data.questions.filter((q) => q.courseId === course.id).length;
            return (
              <article
                key={course.id}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono-num text-xs font-semibold text-blue-900">
                        {course.code} · {course.duration} · {enrolledCount} Students · {qCount} MCQs
                      </p>
                      <h3 className="font-display text-lg font-bold text-slate-900 mt-1">{course.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditCourseModal(course)}
                        aria-label={`Edit ${course.name}`}
                        className="p-1.5 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCourse(course.id)}
                        aria-label={`Delete ${course.name}`}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{course.description}</p>

                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-800" />
                      Syllabus Topics ({course.syllabus.length})
                    </p>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {course.syllabus.map((t, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-mono-num text-slate-400">{String(idx + 1).padStart(2, '0')}.</span>
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Public Fee Display: <strong className="text-slate-700">Hidden ("Contact for Fees")</strong>
                </div>
              </article>
            );
          })}
        </div>

        {/* Add / Edit Course Modal */}
        {courseModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-display font-bold text-slate-900">
                  {editingCourseId ? 'Edit Course Details' : 'Create New Institute Course'}
                </h3>
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  aria-label="Close modal"
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCourseSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                    <input
                      type="text"
                      required
                      value={cCode}
                      onChange={(e) => setCCode(e.target.value)}
                      placeholder="e.g. PGDCA"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                    <input
                      type="text"
                      required
                      value={cDuration}
                      onChange={(e) => setCDuration(e.target.value)}
                      placeholder="e.g. 12 Months"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    placeholder="e.g. Post Graduate Diploma in Computer Applications"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Short Overview</label>
                  <textarea
                    rows={2}
                    value={cDesc}
                    onChange={(e) => setCDesc(e.target.value)}
                    placeholder="Brief career-focused summary of the program"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Syllabus Topics (One topic per line)
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={cSyllabusText}
                    onChange={(e) => setCSyllabusText(e.target.value)}
                    placeholder={'Computer Architecture & OS\nDatabase Management (SQL)\nWeb Engineering'}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCourseModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg"
                  >
                    {editingCourseId ? 'Save Changes' : 'Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // MODE === 'exams': MCQ Bank + 3-Month Mandatory Schedule Control
  return (
    <div className="space-y-6">
      {/* 3-MONTH MANDATORY QUARTERLY EXAM SCHEDULER */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              3-Month Mandatory Quarterly Exam Control
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Triggering a mandatory exam locks student dashboard features until they submit their in-app MCQ test.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {data.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quarterly Exam Title</label>
            <input
              type="text"
              value={quarterLabel}
              onChange={(e) => setQuarterLabel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={() =>
                onTriggerMandatoryExamForCourse(
                  selectedCourseId,
                  quarterLabel.trim() || '3-Month Mandatory Quarterly Exam'
                )
              }
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Lock className="w-4 h-4" />
              Trigger Batch Lock
            </button>
          </div>
        </div>

        {/* Individual Student Lock Status List */}
        {approvedStudents.length === 0 ? (
          <div className="border border-slate-200 rounded-xl px-6 py-10 text-center bg-slate-50/50">
            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <p className="font-display font-semibold text-sm text-slate-800">
              No approved students enrolled yet
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Once students are added or approved, you can trigger or clear 3-month mandatory exam locks for any batch or individual student here.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {/* Responsive Card List (< xl) */}
            <div className="xl:hidden divide-y divide-slate-100">
              {approvedStudents.map((st) => {
                const c = data.courses.find((item) => item.id === st.courseId);
                const locked = isStudentLockedByMandatoryExam(st);
                return (
                  <div key={st.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="font-semibold text-slate-900">{st.name}</p>
                        <span className="font-mono-num text-xs text-slate-500">{st.rollId}</span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="text-xs text-slate-600">{c?.code || '—'}</span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span className="font-mono-num text-xs font-semibold text-blue-950">{st.examPoints} pts</span>
                      </div>
                      <div className="mt-1">
                        {st.courseStatus === 'Completed' ? (
                          <span className="text-xs font-semibold text-emerald-700">Course Completed</span>
                        ) : locked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <Lock className="w-3.5 h-3.5" />
                            Mandatory Exam Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <Unlock className="w-3.5 h-3.5" />
                            Unlocked
                          </span>
                        )}
                      </div>
                    </div>
                    {st.courseStatus !== 'Completed' && (
                      <button
                        type="button"
                        onClick={() =>
                          onToggleStudentMandatoryLock(
                            st.id,
                            !locked,
                            quarterLabel.trim() || '3-Month Mandatory Quarterly Exam'
                          )
                        }
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                          locked
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        {locked ? 'Clear Lock' : 'Assign Mandatory Exam'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Clean Table (xl+) */}
            <div className="hidden xl:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Course</th>
                    <th className="py-2.5 px-4 text-right">Total Points</th>
                    <th className="py-2.5 px-4">Portal Lock State</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {approvedStudents.map((st) => {
                    const c = data.courses.find((item) => item.id === st.courseId);
                    const locked = isStudentLockedByMandatoryExam(st);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{st.name}</p>
                          <p className="font-mono-num text-xs text-slate-500">{st.rollId}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{c?.code || '—'}</td>
                        <td className="py-3 px-4 text-right font-mono-num font-semibold text-blue-950">
                          {st.examPoints} pts
                        </td>
                        <td className="py-3 px-4">
                          {st.courseStatus === 'Completed' ? (
                            <span className="text-xs font-semibold text-emerald-700">Course Completed</span>
                          ) : locked ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <Lock className="w-3.5 h-3.5" />
                              Mandatory Exam Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                              <Unlock className="w-3.5 h-3.5" />
                              Unlocked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {st.courseStatus !== 'Completed' && (
                            <button
                              type="button"
                              onClick={() =>
                                onToggleStudentMandatoryLock(
                                  st.id,
                                  !locked,
                                  quarterLabel.trim() || '3-Month Mandatory Quarterly Exam'
                                )
                              }
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                                locked
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                  : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                              }`}
                            >
                              {locked ? 'Clear Lock' : 'Assign Mandatory Exam'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* MCQ QUESTION BANK BUILDER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleQuestionSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4 h-fit"
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-900" />
            <h3 className="font-display text-base font-bold text-slate-900">Add MCQ Question</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
            >
              {data.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Question Prompt</label>
            <textarea
              rows={2}
              required
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Enter multiple-choice question..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Answer Options (Select correct)</label>
            {[
              { label: 'A', val: optA, set: setOptA, idx: 0 },
              { label: 'B', val: optB, set: setOptB, idx: 1 },
              { label: 'C', val: optC, set: setOptC, idx: 2 },
              { label: 'D', val: optD, set: setOptD, idx: 3 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctOption"
                  checked={correctIdx === item.idx}
                  onChange={() => setCorrectIdx(item.idx)}
                  aria-label={`Mark option ${item.label} as correct`}
                  className="w-4 h-4 text-blue-900"
                />
                <span className="font-mono-num text-xs font-bold text-slate-500 w-4">{item.label}</span>
                <input
                  type="text"
                  required
                  value={item.val}
                  onChange={(e) => item.set(e.target.value)}
                  placeholder={`Option ${item.label}`}
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Points Value</label>
            <input
              type="number"
              min={5}
              max={100}
              step={5}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-32 px-3 py-1.5 text-sm border border-slate-300 rounded-lg font-mono-num"
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Save Question to Bank
          </button>
        </form>

        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-display text-base font-bold text-slate-900">
              Course Question Bank ({filteredQuestions.length})
            </h3>
            <span className="text-xs font-mono-num text-slate-500">
              {data.courses.find((c) => c.id === selectedCourseId)?.code || '—'}
            </span>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No questions added for this course yet. Use the form on the left to add MCQs.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredQuestions.map((q, index) => (
                <div key={q.id} className="p-4 sm:p-5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">
                      <span className="font-mono-num text-blue-900 mr-1.5">{index + 1}.</span>
                      {q.question}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono-num text-xs text-slate-500">{q.points} pts</span>
                      <button
                        type="button"
                        onClick={() => onDeleteQuestion(q.id)}
                        aria-label="Delete question"
                        className="p-1 text-slate-400 hover:text-red-700 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {q.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`px-2.5 py-1.5 rounded-md ${
                          idx === q.correctIndex
                            ? 'bg-emerald-50 text-emerald-900 font-semibold border border-emerald-200'
                            : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className="font-mono-num mr-1.5">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
