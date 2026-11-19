import { AppData, DayOfWeek, Student } from '../types';
import { INITIAL_APP_DATA } from '../data/seedData';

const STORAGE_KEY = 'jit_institute_portal_prod_v2';
const LEGACY_STORAGE_KEY = 'jit_computer_institute_portal_v1';
const LEGACY_DEMO_STUDENT_IDS = new Set([
  'stu-1',
  'stu-2',
  'stu-3',
  'stu-4',
  'stu-5',
  'stu-6',
  'stu-7',
]);

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // One-time clean migration from legacy v1 storage: preserve any real user-created students/courses, drop all demo records
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw) as AppData;
          if (legacyParsed && Array.isArray(legacyParsed.students) && Array.isArray(legacyParsed.courses)) {
            const realStudents = legacyParsed.students.filter(
              (s) => !LEGACY_DEMO_STUDENT_IDS.has(s.id)
            );
            const migrated: AppData = {
              ...INITIAL_APP_DATA,
              courses: legacyParsed.courses.length > 0 ? legacyParsed.courses : INITIAL_APP_DATA.courses,
              questions: Array.isArray(legacyParsed.questions)
                ? legacyParsed.questions
                : INITIAL_APP_DATA.questions,
              students: realStudents,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            localStorage.removeItem(LEGACY_STORAGE_KEY);
            return migrated;
          }
        } catch {
          // fall through to clean initial data
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APP_DATA));
      return INITIAL_APP_DATA;
    }
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.courses)) {
      return INITIAL_APP_DATA;
    }
    return {
      ...parsed,
      instituteContact: INITIAL_APP_DATA.instituteContact,
      certificateConfig: parsed.certificateConfig || INITIAL_APP_DATA.certificateConfig,
    };
  } catch {
    return INITIAL_APP_DATA;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Handle storage quota gracefully without crashing
  }
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const parsed = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Mon';
  return days[parsed.getDay()];
}

export function formatReadableDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const parsed = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function generateRollId(existingStudents: Student[]): string {
  const year = new Date().getFullYear();
  const maxNum = existingStudents.reduce((acc, s) => {
    const parts = s.rollId.split('-');
    const num = parseInt(parts[parts.length - 1], 10);
    return Number.isNaN(num) ? acc : Math.max(acc, num);
  }, 100);
  return `JIT-${year}-${maxNum + 1}`;
}

export function generateReceiptNo(existingStudents: Student[]): string {
  const year = new Date().getFullYear();
  let count = 510;
  existingStudents.forEach((s) => {
    count += s.feeHistory.length;
  });
  return `JIT-RCP-${year}-${count + 1}`;
}

export function calculateAttendancePercentage(student: Student): number {
  if (!student.attendance.length) return 0;
  const present = student.attendance.filter((a) => a.status === 'Present').length;
  return Math.round((present / student.attendance.length) * 100);
}

/**
 * Checks whether a student is locked by the 3-month mandatory exam policy.
 * Triggers if Admin explicitly flagged mandatoryExamDue OR if 90+ days have elapsed
 * since admission / last quarterly exam for an Active Approved student.
 */
export function isStudentLockedByMandatoryExam(student: Student): boolean {
  if (student.approvalStatus !== 'Approved' || student.courseStatus === 'Completed') {
    return false;
  }
  if (student.mandatoryExamDue) {
    return true;
  }
  const referenceDateStr = student.lastQuarterlyExamDate || student.admissionDate;
  const refDate = new Date(`${referenceDateStr}T00:00:00`);
  if (Number.isNaN(refDate.getTime())) return false;
  const diffDays = Math.floor((Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 90;
}

/**
 * Automated 10th-of-Month + 3-Day Interval Reminder Logic
 * Triggers on 11th, 14th, 17th, 20th, 23rd, 26th, 29th of each month.
 */
export const REMINDER_CYCLE_DAYS = [11, 14, 17, 20, 23, 26, 29];

export function isReminderCycleDay(dayOfMonth: number): boolean {
  return dayOfMonth > 10 && (dayOfMonth - 11) % 3 === 0;
}

export function getNextReminderCycleDay(dayOfMonth: number): number {
  for (const d of REMINDER_CYCLE_DAYS) {
    if (d >= dayOfMonth) return d;
  }
  return 11; // Next month's 11th
}

export function buildFeeReminderMessage(studentName: string): string {
  return `Respected ${studentName}, warm greetings from JIT Computer Training Institute. This is a gentle reminder regarding your pending course fee for this month. Kindly ignore this message if already paid. Thank you!`;
}

export function buildSmsHref(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const formattedPhone = digits.length === 10 ? `+91${digits}` : `+${digits}`;
  return `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
}

export function buildWhatsAppHref(whatsappNumber: string, text: string): string {
  const digits = whatsappNumber.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function computeStudentGrade(points: number): string {
  if (points >= 150) return 'A+ (Distinction)';
  if (points >= 100) return 'A (First Class)';
  if (points >= 60) return 'B+ (Merit)';
  return 'B (Pass)';
}

export function normalizePhoneOrEmail(val: string): string {
  return val.trim().toLowerCase().replace(/\s+/g, '');
}
