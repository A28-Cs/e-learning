import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, isEnrolled, requireUser } from "@/lib/serverAuth";
import { autoGrade } from "@/lib/examHelpers";
import type { Exam, ExamAnswer, ExamSubmission } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/exams/[id]/submit — the caller's own submission for this exam, or null
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    const snap = await adminDb
      .collection("examSubmissions")
      .where("examId", "==", params.id)
      .where("studentUid", "==", user.uid)
      .limit(1)
      .get();
    if (snap.empty) return Response.json(null);
    const d = snap.docs[0];
    return Response.json({ id: d.id, ...d.data() } as ExamSubmission);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/exams/[id]/submit — an enrolled student submits answers (MCQ auto-graded)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    const examSnap = await adminDb.collection("exams").doc(params.id).get();
    if (!examSnap.exists) return Response.json({ error: "not_found" }, { status: 404 });
    const exam = { id: examSnap.id, ...(examSnap.data() as Omit<Exam, "id">) };

    if (!exam.published) {
      return Response.json({ error: "not_published" }, { status: 403 });
    }
    if (!user.isAdmin && !(await isEnrolled(user.uid, exam.courseId))) {
      return Response.json({ error: "not_enrolled" }, { status: 403 });
    }

    // One attempt per student.
    const existing = await adminDb
      .collection("examSubmissions")
      .where("examId", "==", exam.id)
      .where("studentUid", "==", user.uid)
      .limit(1)
      .get();
    if (!existing.empty) {
      return Response.json({ error: "already_submitted" }, { status: 409 });
    }

    const body = await req.json();
    const rawAnswers: ExamAnswer[] = Array.isArray(body.answers) ? body.answers : [];
    // Keep only answers to real questions.
    const validIds = new Set(exam.questions.map((q) => q.id));
    const cleaned = rawAnswers
      .filter((a) => validIds.has(a.questionId))
      .map((a) => ({
        questionId: a.questionId,
        selectedIndex: typeof a.selectedIndex === "number" ? a.selectedIndex : null,
        text: typeof a.text === "string" ? a.text : "",
      }));

    const { answers, autoScore, maxScore, hasEssay } = autoGrade(exam.questions, cleaned);

    const doc = adminDb.collection("examSubmissions").doc();
    const submission: Omit<ExamSubmission, "id"> = {
      examId: exam.id,
      examTitle: exam.title,
      courseId: exam.courseId,
      teacherId: exam.teacherId,
      studentUid: user.uid,
      studentName: user.name,
      studentEmail: user.email,
      answers,
      autoScore,
      maxScore,
      totalScore: autoScore, // essays add on once graded
      graded: !hasEssay, // no essays -> already fully graded
      teacherNote: null,
      submittedAt: Date.now(),
      gradedAt: hasEssay ? null : Date.now(),
    };
    await doc.set(submission);
    return Response.json({ id: doc.id, autoScore, maxScore, graded: !hasEssay }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
