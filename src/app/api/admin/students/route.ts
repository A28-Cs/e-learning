import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/admin/students — all registered users, newest first
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb.collection("users").get();
    const students = snap.docs
      .map((d) => {
        const u = d.data();
        return {
          uid: d.id,
          name: u.name ?? "",
          email: u.email ?? "",
          role: (u.role as Role | undefined) ?? "student",
          enrolledCount: Array.isArray(u.enrolledCourses) ? u.enrolledCourses.length : 0,
          createdAt: Number(u.createdAt ?? 0),
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    return Response.json(students);
  } catch (err) {
    return errorResponse(err);
  }
}
