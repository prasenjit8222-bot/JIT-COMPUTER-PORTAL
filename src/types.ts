export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const ALL_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const FULL_DAY_NAMES: Record<DayOfWeek, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type CourseStatus = 'Active' | 'Completed';
export type FeeStatus = 'Paid' | 'Due';

export interface Course {
  id: string;
  code: string;
  name: string;
  duration: string;
  description: string;
  syllabus: string[];
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  day: DayOfWeek;
  status: 'Present' | 'Absent';
}

export interface FeePayment {
  id: string;
  receiptNo: string;
  monthLabel: string;
  amountPaid: number;
  paidDate: string; // YYYY-MM-DD
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card';
  remarks?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'fee' | 'exam' | 'notice' | 'certificate';
  read: boolean;
}

export interface ExamQuestion {
  id: string;
  courseId: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  points: number;
}

export interface ExamSubmission {
  id: string;
  examTitle: string;
  submittedAt: string; // YYYY-MM-DD
  score: number;
  maxScore: number;
  percentage: number;
  isMandatoryQuarterly: boolean;
}

export interface Student {
  id: string;
  rollId: string;
  name: string;
  phone: string;
  email: string;
  courseId: string;
  admissionDate: string; // YYYY-MM-DD
  approvalStatus: ApprovalStatus;
  courseStatus: CourseStatus;
  completionDate?: string; // YYYY-MM-DD
  scheduledDays: DayOfWeek[];
  attendance: AttendanceRecord[];
  feeStatus: FeeStatus;
  autoReminderEnabled: boolean;
  feeHistory: FeePayment[];
  lastReminderSentAt?: string;
  examPoints: number;
  examHistory: ExamSubmission[];
  mandatoryExamDue: boolean;
  mandatoryExamLabel?: string;
  lastQuarterlyExamDate?: string; // YYYY-MM-DD
  notifications: NotificationItem[];
}

export interface CertificateConfig {
  instituteName: string;
  subtitle: string;
  registrationNo: string;
  directorName: string;
  directorTitle: string;
  sealText: string;
  templateMode: 'classic_gold' | 'royal_clean' | 'custom';
  customBackgroundDataUrl?: string;
  directorSignatureDataUrl?: string;
}

export interface InstituteContact {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  officeHours: string;
}

export interface AppData {
  courses: Course[];
  students: Student[];
  questions: ExamQuestion[];
  certificateConfig: CertificateConfig;
  instituteContact: InstituteContact;
}

export type AuthSession =
  | { role: 'guest' }
  | { role: 'admin'; username: string }
  | { role: 'student'; studentId: string };

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}
