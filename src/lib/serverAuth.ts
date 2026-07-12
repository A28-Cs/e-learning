import { NextRequest } from "next/server";
import { adminAuth } from "./firebaseAdmin";

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
