import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  errorResponse,
  requireCourseOwner,
  requireRole,
} from "@/lib/serverAuth";
import type { CodeRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/code-requests
//   admin (default) -> all requests; ?mine=1 or teacher -> only own requests
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ["teacher"]);
    const mine = req.nextUrl.searchParams.get("mine") === "1";

    let query: FirebaseFirestore.Query = adminDb.collection("codeRequests");
    if (mine || user.role === "teacher") {
      query = query.where("teacherId", "==", user.uid);
    }
    const snap = await query.get();
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as CodeRequest)
      .sort((a, b) => b.createdAt - a.createdAt);
    return Response.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/code-requests — a teacher (or admin) requests a code for a student
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const courseId = String(body.courseId ?? "");
    const studentEmail = String(body.studentEmail ?? "").trim().toLowerCase();
    if (!courseId || !studentEmail) {
      return Response.json({ error: "bad_request" }, { status: 400 });
    }
    // Ownership check: only the course's teacher (or an admin) may request codes for it.
    const { user, course } = await requireCourseOwner(req, courseId);

    const doc = adminDb.collection("codeRequests").doc();
    const request: Omit<CodeRequest, "id"> = {
      teacherId: user.uid,
      teacherName: user.name,
      studentUid: null,
      studentEmail,
      courseId,
      courseTitleAr: course.titleAr,
      courseTitleEn: course.titleEn,
      status: "pending",
      code: null,
      adminNote: null,
      createdAt: Date.now(),
      reviewedAt: null,
      reviewedBy: null,
    };
    await doc.set(request);
    return Response.json({ id: doc.id, ...request }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
