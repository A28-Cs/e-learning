import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin, requireRole } from "@/lib/serverAuth";
import type { TeacherPayout } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/payouts — admin sees all; a teacher sees only their own
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ["teacher"]);
    let query: FirebaseFirestore.Query = adminDb.collection("teacherPayouts");
    if (!user.isAdmin) {
      query = query.where("teacherId", "==", user.uid);
    }
    const snap = await query.get();
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as TeacherPayout)
      .sort((a, b) => b.createdAt - a.createdAt);
    return Response.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/payouts — admin records an amount owed to a teacher
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const teacherId = String(body.teacherId ?? "");
    const amount = Number(body.amount ?? 0);
    if (!teacherId || !(amount > 0)) {
      return Response.json({ error: "bad_request" }, { status: 400 });
    }
    const teacherSnap = await adminDb.collection("users").doc(teacherId).get();
    if (!teacherSnap.exists) {
      return Response.json({ error: "teacher_not_found" }, { status: 404 });
    }
    const teacher = teacherSnap.data()!;

    const doc = adminDb.collection("teacherPayouts").doc();
    const payout: Omit<TeacherPayout, "id"> = {
      teacherId,
      teacherName: (teacher.name as string) ?? "",
      teacherEmail: (teacher.email as string) ?? "",
      courseId: body.courseId ? String(body.courseId) : null,
      courseTitleAr: body.courseTitleAr ? String(body.courseTitleAr) : null,
      courseTitleEn: body.courseTitleEn ? String(body.courseTitleEn) : null,
      amount,
      currency: String(body.currency ?? "EGP"),
      status: "owed",
      note: body.note ? String(body.note) : null,
      createdAt: Date.now(),
      paidAt: null,
      paidBy: null,
    };
    await doc.set(payout);
    return Response.json({ id: doc.id, ...payout }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
