import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "./firebaseAdmin";
import type { Course, Role } from "./types";

export interface AuthedUser {
  uid: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function getAuthedUser(req: NextRequest): Promise<AuthedUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: (decoded.name as string) ?? "",
      isAdmin: isAdminEmail(decoded.email),
    };
  } catch {
    return null;
  }
}

export async function requireUser(req: NextRequest): Promise<AuthedUser> {
  const user = await getAuthedUser(req);
  if (!user) throw new HttpError(401, "Unauthorized");
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<AuthedUser> {
  const user = await requireUser(req);
  if (!user.isAdmin) throw new HttpError(403, "Forbidden");
  return user;
}

export async function getStoredRole(uid: string): Promise<Role> {
  const snap = await adminDb.collection("users").doc(uid).get();
  const role = snap.data()?.role as Role | undefined;
  return role ?? "student";
}

/** Admin always passes, regardless of the `allowed` list. */
export async function requireRole(
  req: NextRequest,
  allowed: Role[]
): Promise<AuthedUser & { role: Role }> {
  const user = await requireUser(req);
  if (user.isAdmin) return { ...user, role: "admin" };
  const role = await getStoredRole(user.uid);
  if (!allowed.includes(role)) throw new HttpError(403, "Forbidden");
  return { ...user, role };
}

export async function requireTeacher(req: NextRequest): Promise<AuthedUser & { role: Role }> {
  return requireRole(req, ["teacher"]);
}

/**
 * Requires the caller to be an admin, or a teacher who owns the given course.
 * Returns the loaded course doc so callers don't need to re-fetch it.
 */
export async function requireCourseOwner(
  req: NextRequest,
  courseId: string
): Promise<{ user: AuthedUser & { role: Role }; course: Course & { id: string } }> {
  const user = await requireUser(req);
  const ref = adminDb.collection("courses").doc(courseId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "Course not found");
  const course = { id: snap.id, ...(snap.data() as Omit<Course, "id">) };

  if (user.isAdmin) return { user: { ...user, role: "admin" }, course };

  const role = await getStoredRole(user.uid);
  if (role !== "teacher" || course.teacherId !== user.uid) {
    throw new HttpError(403, "Forbidden");
  }
  return { user: { ...user, role }, course };
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
