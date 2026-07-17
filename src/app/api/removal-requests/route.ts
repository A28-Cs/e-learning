import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  errorResponse,
  requireCourseOwner,
  requireRole,
} from "@/lib/serverAuth";
import type { RemovalRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/removal-requests — teacher sees own; admin sees all (default)
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, ["teacher"]);
    const mine = req.nextUrl.searchParams.get("mine") === "1";

    let query: FirebaseFirestore.Query = adminDb.collection("removalRequests");
    if (mine || user.role === "teacher") {
      query = query.where("teacherId", "==", user.uid);
    }
    const snap = await query.get();
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as RemovalRequest)
      .sort((a, b) => b.createdAt - a.createdAt);
    return Response.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/removal-requests — teacher asks to remove an enrolled student
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const courseId = String(body.courseId ?? "");
    const studentUid = String(body.studentUid ?? "");
    const reason = String(body.reason ?? "").trim();
    if (!courseId || !studentUid || !reason) {
      return Response.json({ error: "bad_request" }, { status: 400 });
    }
    const { user, course } = await requireCourseOwner(req, courseId);

    const studentSnap = await adminDb.collection("users").doc(studentUid).get();
    const student = studentSnap.data() ?? {};
    const enrolled = (student.enrolledCourses ?? []) as string[];
    if (!enrolled.includes(courseId)) {
      return Response.json({ error: "not_enrolled" }, { status: 400 });
    }

    const doc = adminDb.collection("removalRequests").doc();
    const request: Omit<RemovalRequest, "id"> = {
      teacherId: user.uid,
      teacherName: user.name,
      courseId,
      courseTitleAr: course.titleAr,
      courseTitleEn: course.titleEn,
      studentUid,
      studentEmail: (student.email as string) ?? "",
      reason,
      status: "pending",
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
