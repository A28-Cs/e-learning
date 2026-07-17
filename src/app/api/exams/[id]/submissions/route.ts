import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireCourseOwner } from "@/lib/serverAuth";
import type { Exam, ExamSubmission } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/exams/[id]/submissions — course owner lists all submissions for an exam
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const examSnap = await adminDb.collection("exams").doc(params.id).get();
    if (!examSnap.exists) return Response.json({ error: "not_found" }, { status: 404 });
    const exam = examSnap.data() as Omit<Exam, "id">;
    await requireCourseOwner(req, exam.courseId);

    const snap = await adminDb
      .collection("examSubmissions")
      .where("examId", "==", params.id)
      .get();
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as ExamSubmission)
      .sort((a, b) => b.submittedAt - a.submittedAt);
    return Response.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}
