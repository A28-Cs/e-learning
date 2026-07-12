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
  price: number;
  currency: string;
  thumbnail: string;
  published: boolean;
  lessonsCount: number;
  createdAt: number;
}

export interface Lesson {
  id: string;
  titleAr: string;
  titleEn: string;
  order: number;
  isFree: boolean;
  muxAssetId: string;
  muxPlaybackId?: string;
  duration: number;
  status: "preparing" | "ready" | "errored";
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
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

export interface ActivationCode {
  code: string;
  courseId: string;
  used: boolean;
  usedBy: string | null;
  usedByEmail: string | null;
  createdAt: number;
  usedAt: number | null;
}
