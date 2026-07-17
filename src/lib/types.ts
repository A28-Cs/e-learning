export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  order: number;
}

export interface Course {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  categoryId: string;
  teacherId: string | null;
  /** Server-computed, read-only: sum of non-free lesson prices. Never set directly by clients. */
  price: number;
  currency: string;
  thumbnail: string;
  published: boolean;
  featured: boolean;
  lessonsCount: number;
  createdAt: number;
  ratingAvg?: number;
  ratingCount?: number;
}

export interface Lesson {
  id: string;
  titleAr: string;
  titleEn: string;
  order: number;
  isFree: boolean;
  /** Forced to 0 when isFree is true. */
  price: number;
  muxAssetId: string;
  muxPlaybackId?: string;
  duration: number;
  status: "preparing" | "ready" | "errored";
  createdAt: number;
  ratingAvg?: number;
  ratingCount?: number;
}

export type Role = "admin" | "teacher" | "student";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
  /** Set when a user registers as a teacher; role stays "student" until admin approves. */
  teacherRequest?: "pending" | "approved" | "rejected" | null;
  enrolledCourses: string[];
  isAdmin: boolean;
  createdAt: number;
}

export interface Order {
  id: string;
  uid: string;
  email: string;
  courseId: string;
  courseTitleAr: string;
  courseTitleEn: string;
  amountCents: number;
  status: "pending" | "paid" | "failed";
  paymobTransactionId: string | null;
  createdAt: number;
  paidAt: number | null;
}

export interface PaymentSettings {
  vodafoneCash: string;
  instapay: string;
  enabled: boolean;
}

export interface PaymentRequest {
  id: string;
  uid: string;
  email: string;
  name: string;
  courseId: string;
  courseTitleAr: string;
  courseTitleEn: string;
  amount: number;
  method: "vodafone_cash" | "instapay";
  transactionRef: string;
  receiptUrl: string;
  status: "pending" | "approved" | "rejected";
  adminNote: string | null;
  createdAt: number;
  reviewedAt: number | null;
  reviewedBy: string | null;
}

export interface SecurityEvent {
  id: string;
  uid: string;
  email: string;
  type: "screenshot" | "record";
  courseId: string;
  lessonId: string;
  seen: boolean;
  createdAt: number;
}

export interface ActivationCode {
  code: string;
  courseId: string;
  used: boolean;
  usedBy: string | null;
  usedByEmail: string | null;
  createdAt: number;
  usedAt: number | null;
  restrictedToUid?: string | null;
  restrictedToEmail?: string | null;
}

export interface CodeRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  studentUid: string | null;
  studentEmail: string;
  courseId: string;
  courseTitleAr: string;
  courseTitleEn: string;
  status: "pending" | "approved" | "rejected";
  code: string | null;
  adminNote: string | null;
  createdAt: number;
  reviewedAt: number | null;
  reviewedBy: string | null;
}

export interface RemovalRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  courseId: string;
  courseTitleAr: string;
  courseTitleEn: string;
  studentUid: string;
  studentEmail: string;
  reason: string;
  status: "pending" | "contacted_student" | "approved" | "rejected";
  adminNote: string | null;
  createdAt: number;
  reviewedAt: number | null;
  reviewedBy: string | null;
}

export interface TeacherPayout {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  courseId: string | null;
  courseTitleAr: string | null;
  courseTitleEn: string | null;
  amount: number;
  currency: string;
  status: "owed" | "paid";
  note: string | null;
  createdAt: number;
  paidAt: number | null;
  paidBy: string | null;
}

export interface EnrollmentCancellation {
  id: string;
  uid: string;
  email: string;
  courseId: string;
  createdAt: number;
}

export interface CourseReview {
  uid: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: number;
  updatedAt: number;
}

export type LessonReview = CourseReview;

export interface Testimonial {
  uid: string;
  name: string;
  rating: number;
  comment: string;
  lang: "ar" | "en";
  courseId: string;
  createdAt: number;
  updatedAt: number;
}

export type QuestionType = "mcq" | "essay";

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  text: string;
  points: number;
  /** MCQ only. */
  options?: string[];
  /** MCQ only: index into options of the correct answer. Stripped before sending to students. */
  correctIndex?: number;
}

export interface Exam {
  id: string;
  courseId: string;
  teacherId: string;
  title: string;
  instructions: string;
  questions: ExamQuestion[];
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ExamAnswer {
  questionId: string;
  /** MCQ answer. */
  selectedIndex?: number | null;
  /** Essay answer. */
  text?: string;
  /** Points the teacher (or auto-grader) awarded for this answer. */
  awardedPoints?: number;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  examTitle: string;
  courseId: string;
  teacherId: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  answers: ExamAnswer[];
  /** Auto-graded MCQ points. */
  autoScore: number;
  /** Total points available across all questions. */
  maxScore: number;
  /** Final score once essays are graded (equals autoScore when there are no essays). */
  totalScore: number;
  /** True when every essay question has been graded by the teacher. */
  graded: boolean;
  teacherNote: string | null;
  submittedAt: number;
  gradedAt: number | null;
}

export interface CourseProgress {
  courseId: string;
  completedLessons: string[];
  completed: boolean;
  completedAt: number | null;
  updatedAt: number;
}
