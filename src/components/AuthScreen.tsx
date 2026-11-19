import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  Phone,
  MessageCircle,
  Clock,
  UserPlus,
  LogIn,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import { AppData, Student } from '../types';
import { CAMPUS_LAB_IMAGE, INSTITUTE_LOGO_IMAGE } from '../data/seedData';
import { buildWhatsAppHref, formatReadableDate, normalizePhoneOrEmail } from '../utils/helpers';

const AUTHORIZED_ADMIN_MOBILE_ID = '8017462677';
const SECRET_CLICK_TARGET = 5;
const SECRET_CLICK_WINDOW_MS = 3000;

interface AuthScreenProps {
  data: AppData;
  onStudentLoginSuccess: (studentId: string) => void;
  onAdminLoginSuccess: () => void;
  onNewAdmissionRequest: (payload: {
    name: string;
    phone: string;
    email: string;
    courseId: string;
  }) => Student;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, description?: string) => void;
}

type AuthTab = 'student_login' | 'new_admission';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  data,
  onStudentLoginSuccess,
  onAdminLoginSuccess,
  onNewAdmissionRequest,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('student_login');
  const [labImgError, setLabImgError] = useState(false);

  // Student Login State
  const [identifier, setIdentifier] = useState('');
  const [statusViewStudent, setStatusViewStudent] = useState<Student | null>(null);

  // New Admission Form State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCourseId, setRegCourseId] = useState(data.courses[0]?.id || '');

  // Secret 5-Click Admin Verification Modal State
  const clickTimestampsRef = useRef<number[]>([]);
  const [secretAdminModalOpen, setSecretAdminModalOpen] = useState(false);
  const [adminMobileId, setAdminMobileId] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleSecretBrandClick = () => {
    const now = Date.now();
    const recent = clickTimestampsRef.current.filter((ts) => now - ts <= SECRET_CLICK_WINDOW_MS);
    recent.push(now);
    clickTimestampsRef.current = recent;

    if (recent.length >= SECRET_CLICK_TARGET) {
      clickTimestampsRef.current = [];
      setAdminMobileId('');
      setAdminError('');
      setSecretAdminModalOpen(true);
    }
  };

  const handleAdminVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = adminMobileId.trim();
    if (cleaned === AUTHORIZED_ADMIN_MOBILE_ID) {
      setAdminError('');
      setSecretAdminModalOpen(false);
      setAdminMobileId('');
      onAdminLoginSuccess();
      onNotify('success', 'Admin Verification Successful', 'Signed in to JIT Computer Institute Admin Console.');
    } else {
      const msg = 'Invalid Admin Mobile ID. Access denied. Please enter the authorized Admin Mobile ID.';
      setAdminError(msg);
      onNotify('error', 'Admin Verification Failed', 'The entered Admin Mobile ID is not authorized.');
    }
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizePhoneOrEmail(identifier);
    if (!cleaned) {
      onNotify('warning', 'Enter Contact Number or Email', 'Please enter your registered mobile number or email ID.');
      return;
    }

    const found = data.students.find((s) => {
      const phoneMatch =
        s.phone.replace(/\D/g, '') === cleaned.replace(/\D/g, '') &&
        cleaned.replace(/\D/g, '').length >= 6;
      const emailMatch = s.email.toLowerCase() === cleaned;
      const rollMatch = s.rollId.toLowerCase() === cleaned;
      return phoneMatch || emailMatch || rollMatch;
    });

    if (!found) {
      onNotify(
        'error',
        'Student Record Not Found',
        'No account matches that phone or email. Use "New Admission" to submit your registration request.'
      );
      return;
    }

    if (found.approvalStatus === 'Pending' || found.approvalStatus === 'Rejected') {
      setStatusViewStudent(found);
      return;
    }

    onStudentLoginSuccess(found.id);
    onNotify('success', `Welcome back, ${found.name}`, `Signed in to JIT Student Portal (${found.rollId}).`);
  };

  const handleNewAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = regName.trim();
    const cleanedPhone = regPhone.replace(/\D/g, '');
    const trimmedEmail = regEmail.trim().toLowerCase();

    if (!trimmedName || cleanedPhone.length < 10 || !trimmedEmail.includes('@') || !regCourseId) {
      onNotify(
        'warning',
        'Complete All Admission Fields',
        'Please provide your full name, 10-digit contact number, valid email ID, and desired course.'
      );
      return;
    }

    const duplicate = data.students.find(
      (s) => s.phone.replace(/\D/g, '') === cleanedPhone || s.email.toLowerCase() === trimmedEmail
    );
    if (duplicate) {
      onNotify(
        'info',
        'Registration Already Exists',
        'An admission record with this contact number or email already exists. Showing current status.'
      );
      if (duplicate.approvalStatus === 'Approved') {
        onStudentLoginSuccess(duplicate.id);
      } else {
        setStatusViewStudent(duplicate);
      }
      return;
    }

    const created = onNewAdmissionRequest({
      name: trimmedName,
      phone: cleanedPhone,
      email: trimmedEmail,
      courseId: regCourseId,
    });

    setRegName('');
    setRegPhone('');
    setRegEmail('');
    setStatusViewStudent(created);
    onNotify(
      'success',
      'Admission Request Submitted',
      'Your request is now Pending Approval from JIT Computer Admin.'
    );
  };

  const secretAdminModal = secretAdminModalOpen && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-verification-title"
      className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <h2 id="admin-verification-title" className="font-display font-bold text-base">
              Admin Verification
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setSecretAdminModalOpen(false);
              setAdminError('');
              setAdminMobileId('');
            }}
            aria-label="Close Admin Verification"
            className="p-1 text-indigo-200 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAdminVerificationSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Authorized institute personnel only. Enter your registered <strong>Admin Mobile ID</strong> to unlock the JIT Admin Control Panel.
          </p>

          <div>
            <label
              htmlFor="secret-admin-mobile-id"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              Admin Mobile ID
            </label>
            <input
              id="secret-admin-mobile-id"
              type="tel"
              inputMode="numeric"
              autoFocus
              required
              value={adminMobileId}
              onChange={(e) => {
                setAdminMobileId(e.target.value);
                if (adminError) setAdminError('');
              }}
              placeholder="Enter 10-digit Admin Mobile ID"
              className={`w-full px-3.5 py-2.5 text-sm font-mono-num border rounded-lg text-slate-900 placeholder:text-slate-400 ${
                adminError ? 'border-red-500 bg-red-50/40' : 'border-slate-300 bg-white'
              }`}
            />
          </div>

          {adminError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{adminError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSecretAdminModalOpen(false);
                setAdminError('');
                setAdminMobileId('');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify &amp; Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Polite Pending / Rejected Admission Status Screen
  if (statusViewStudent) {
    const course = data.courses.find((c) => c.id === statusViewStudent.courseId);
    const isRejected = statusViewStudent.approvalStatus === 'Rejected';
    const whatsappText = `Hello JIT Computer Training Institute, I submitted an admission request for ${statusViewStudent.name} (${statusViewStudent.rollId}) for ${course?.name || 'a course'}. Please review my approval status.`;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div
              onClick={handleSecretBrandClick}
              className="flex items-center gap-3 select-none cursor-default"
            >
              <img
                src={INSTITUTE_LOGO_IMAGE}
                alt="Jharna Institute of Technology (JIT) Official Logo"
                referrerPolicy="no-referrer"
                className="h-11 sm:h-12 w-auto object-contain shrink-0"
              />
              <span className="font-display font-bold text-sm sm:text-base text-slate-900 tracking-tight whitespace-nowrap">
                JHARNA INSTITUTE OF TECHNOLOGY (JIT)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStatusViewStudent(null)}
              className="text-sm font-semibold text-blue-900 hover:text-blue-700 whitespace-nowrap shrink-0"
            >
              Back to Login
            </button>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                isRejected ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isRejected ? <XCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>

            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              {isRejected ? 'Admission Request Not Approved' : 'Admission Awaiting Admin Approval'}
            </h1>

            <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
              {isRejected
                ? `Dear ${statusViewStudent.name}, your recent admission request could not be processed at this time. Please contact the JIT Computer office for assistance.`
                : `Thank you for registering, ${statusViewStudent.name}. Your admission request is currently Pending Approval from JIT Computer Admin. Once approved, your full Student Dashboard, weekly schedule, and MCQ exam center will unlock automatically.`}
            </p>

            <div className="mt-6 pt-5 border-t border-slate-200 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Applicant Name</span>
                <span className="font-semibold text-slate-900">{statusViewStudent.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Provisional Roll ID</span>
                <span className="font-mono-num font-semibold text-slate-900">{statusViewStudent.rollId}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Desired Course</span>
                <span className="font-medium text-slate-900 text-right">{course?.name || '—'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Submitted On</span>
                <span className="font-mono-num text-slate-700">{formatReadableDate(statusViewStudent.admissionDate)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Current Status</span>
                <span className={`font-semibold ${isRejected ? 'text-red-700' : 'text-amber-700'}`}>
                  {isRejected ? 'Rejected' : 'Pending Approval'}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a
                href={`tel:${data.instituteContact.phone.replace(/\s+/g, '')}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap"
              >
                <Phone className="w-4 h-4" />
                Call JIT Admin
              </a>
              <a
                href={buildWhatsAppHref(data.instituteContact.whatsapp, whatsappText)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Office
              </a>
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              Email:{' '}
              <a
                href={`mailto:${data.instituteContact.email}`}
                className="font-mono-num font-medium text-blue-900 hover:underline"
              >
                {data.instituteContact.email}
              </a>
            </p>
          </div>
        </main>

        {secretAdminModal}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Clean Top Header — ONLY Institute Brand Logo/Title + Quiet Office Contact */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          <div
            onClick={handleSecretBrandClick}
            className="flex items-center gap-3 shrink-0 select-none cursor-default"
          >
            <img
              src={INSTITUTE_LOGO_IMAGE}
              alt="Jharna Institute of Technology (JIT) Official Logo"
              referrerPolicy="no-referrer"
              className="h-11 sm:h-12 w-auto object-contain shrink-0"
            />
            <span className="font-display font-bold text-sm sm:text-lg tracking-tight text-slate-900 whitespace-nowrap">
              JHARNA INSTITUTE OF TECHNOLOGY (JIT)
            </span>
          </div>

          <div className="hidden md:flex items-center gap-5 text-sm text-slate-600">
            <a
              href={`tel:${data.instituteContact.phone.replace(/\s+/g, '')}`}
              className="hover:text-blue-900 transition-colors whitespace-nowrap shrink-0 font-mono-num"
            >
              {data.instituteContact.phone}
            </a>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="whitespace-nowrap shrink-0">{data.instituteContact.officeHours}</span>
          </div>
        </div>
      </header>

      {/* Main 2-Column Stretched Split — Clean Institutional Hero + Student Login / New Admission */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 lg:py-14 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Visual Hero Panel (Zero Student Data / Zero Stats Block) */}
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-slate-200 bg-blue-950 min-h-[280px] sm:min-h-[340px] lg:min-h-[540px] flex flex-col justify-end">
            {!labImgError ? (
              <img
                src={CAMPUS_LAB_IMAGE}
                alt="JIT Computer Training Institute modern computer laboratory"
                referrerPolicy="no-referrer"
                onError={() => setLabImgError(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/10" />

            <div className="relative z-10 p-6 sm:p-8 lg:p-10 text-white space-y-3">
              <p className="text-xs font-semibold text-emerald-300 tracking-wide">
                ISO 9001:2015 Certified · Practical Computer Education
              </p>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance leading-tight">
                Student Portal &amp; Admission Desk
              </h1>
              <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed">
                Sign in with your registered Contact Number or Email ID to view weekly class days, track attendance, complete quarterly MCQ assessments, check fee receipts, and download official certificates.
              </p>
            </div>
          </div>

          {/* Right Student Login / New Admission Card (No Visible Admin Login) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Official Institute Logo Lockup (5-Click Secret Admin Trigger) */}
              <div
                onClick={handleSecretBrandClick}
                className="flex flex-col items-center text-center mb-5 select-none cursor-default"
              >
                <img
                  src={INSTITUTE_LOGO_IMAGE}
                  alt="Jharna Institute of Technology (JIT) Official Logo"
                  referrerPolicy="no-referrer"
                  className="h-16 sm:h-20 w-auto object-contain"
                />
              </div>

              {/* 2-Tab Segmented Switcher: Student Login | New Admission */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('student_login')}
                  className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'student_login'
                      ? 'bg-white text-blue-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Student Login
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('new_admission')}
                  className={`py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === 'new_admission'
                      ? 'bg-white text-blue-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Admission
                </button>
              </div>

              {/* TAB 1: STUDENT LOGIN */}
              {activeTab === 'student_login' && (
                <form onSubmit={handleStudentLogin} className="space-y-5">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">Student Portal Sign In</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Enter your registered Contact Number or Email ID to access your account.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="student-identifier"
                      className="block text-sm font-medium text-slate-700 mb-1.5"
                    >
                      Contact Number or Email ID
                    </label>
                    <input
                      id="student-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter registered mobile number or email"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-blue-700"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Access Student Portal
                  </button>

                  <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-2.5">
                    <p className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Approved students unlock class schedules, MCQ exams, fee receipts, and certificates.</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>New applicants can check their Pending Approval status anytime using their contact number.</span>
                    </p>
                  </div>
                </form>
              )}

              {/* TAB 2: NEW ADMISSION REQUEST */}
              {activeTab === 'new_admission' && (
                <form onSubmit={handleNewAdmissionSubmit} className="space-y-4">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">New Admission Request</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Submit your admission request below. Your portal unlocks once approved by JIT Computer Admin.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1">
                      Student Full Name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="reg-phone" className="block text-sm font-medium text-slate-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        id="reg-phone"
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="10-digit mobile"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 font-mono-num"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">
                        Email ID
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="student@email.com"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-course" className="block text-sm font-medium text-slate-700 mb-1">
                      Desired Course
                    </label>
                    <select
                      id="reg-course"
                      value={regCourseId}
                      onChange={(e) => setRegCourseId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg text-slate-900 bg-white"
                    >
                      {data.courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} — {course.name} ({course.duration})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Submit Admission Request
                  </button>
                </form>
              )}
            </div>

            {/* Quiet Institute Helpdesk Footer */}
            <div className="mt-8 pt-5 border-t border-slate-200 text-xs text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700">Admissions Helpdesk</p>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono-num">
                <a
                  href={`tel:${data.instituteContact.phone.replace(/\s+/g, '')}`}
                  className="text-blue-900 hover:underline font-medium"
                >
                  {data.instituteContact.phone}
                </a>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <a
                  href={`https://wa.me/${data.instituteContact.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:underline font-medium"
                >
                  WhatsApp
                </a>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <a
                  href={`mailto:${data.instituteContact.email}`}
                  className="text-blue-900 hover:underline font-medium"
                >
                  {data.instituteContact.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {secretAdminModal}
    </div>
  );
};
