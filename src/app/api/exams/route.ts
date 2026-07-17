import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  errorResponse,
  getStoredRole,
  isEnrolled,
  requireCourseOwner,
  requireUser,
} from "@/lib/serverAuth";
import { sanitizeExam } from "@/lib/examHelpers";
import type { Exam } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/exams?courseId=... — course owner sees all exams (with answers);
// an enrolled student sees only published exams (answers stripped).
export async function GET(req: NextRequest) {
  try {
    const courseId = req.nextUrl.searchParams.get("courseId");
    if (!courseId) {
      return Response.json({ error: "courseId is required" }, { status: 400 });
    }
    const user = await requireUser(req);

    const courseSnap = await adminDb.collection("courses").doc(courseId).get();
    if (!courseSnap.exists) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const isOwner =
      user.isAdmin ||
      ((await getStoredRole(user.uid)) === "teacher" &&
        courseSnap.data()!.teacherId === user.uid);

    const snap = await adminDb.collection("exams").where("courseId", "==", courseId).get();
    let exams = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Exam)
      .sort((a, b) => b.createdAt - a.createdAt);

    if (!isOwner) {
      if (!(await isEnrolled(user.uid, courseId))) {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      exams = exams.filter((e) => e.published).map(sanitizeExam);
    }
    return Response.json(exams);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/exams — create an empty exam for a course (owner only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const courseId = String(body.courseId ?? "");
    if (!courseId) {
      return Response.json({ error: "courseId is required" }, { status: 400 });
    }
    const { user } = await requireCourseOwner(req, courseId);

    const doc = adminDb.collection("exams").doc();
    const now = Date.now();
    const exam: Omit<Exam, "id"> = {
      courseId,
      teacherId: user.uid,
      title: String(body.title ?? "").trim() || "Untitled",
      instructions: String(body.instructions ?? ""),
      questions: [],
      published: false,
      createdAt: now,
      updatedAt: now,
    };
    await doc.set(exam);
    return Response.json({ id: doc.id, ...exam }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
