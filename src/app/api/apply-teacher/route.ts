import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, getStoredRole, requireUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// POST /api/apply-teacher — a user asks to become a teacher.
// Role stays "student" until an admin approves; we just flag the request.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (user.isAdmin) {
      return Response.json({ error: "already_privileged" }, { status: 400 });
    }
    const role = await getStoredRole(user.uid);
    if (role === "teacher") {
      return Response.json({ error: "already_teacher" }, { status: 400 });
    }
    await adminDb.collection("users").doc(user.uid).set(
      {
        name: user.name,
        email: user.email,
        role: "student",
        teacherRequest: "pending",
      },
      { merge: true }
    );
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
