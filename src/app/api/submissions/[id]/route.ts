import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireCourseOwner } from "@/lib/serverAuth";
import type { Exam, ExamAnswer, ExamSubmission } from "@/lib/types";

export const dynamic = "force-dynamic";

// PUT /api/submissions/[id] — course owner grades essay answers and finalizes the score.
// Body: { grades: { [questionId]: points }, note?: string }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ref = adminDb.collection("examSubmissions").doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) return Response.json({ error: "not_found" }, { status: 404 });
    const sub = snap.data() as Omit<ExamSubmission, "id">;
    await requireCourseOwner(req, sub.courseId);

    const examSnap = await adminDb.collection("exams").doc(sub.examId).get();
    const questions = (examSnap.data()?.questions ?? []) as Exam["questions"];
    const maxById = new Map(questions.map((q) => [q.id, q]));

    const body = await req.json();
    const grades = (body.grades ?? {}) as Record<string, number>;

    const answers: ExamAnswer[] = sub.answers.map((a) => {
      const q = maxById.get(a.questionId);
      // Only essay answers are (re)graded here; MCQ awards stay as auto-graded.
      if (q && q.type === "essay" && a.questionId in grades) {
        const capped = Math.max(0, Math.min(Number(grades[a.questionId]) || 0, q.points));
        return { ...a, awardedPoints: capped };
      }
      return a;
    });

    const totalScore = answers.reduce((sum, a) => sum + (a.awardedPoints ?? 0), 0);

    await ref.update({
      answers,
      totalScore,
      graded: true,
      gradedAt: Date.now(),
      teacherNote: body.note ? String(body.note) : sub.teacherNote ?? null,
    });
    return Response.json({ ok: true, totalScore });
  } catch (err) {
    return errorResponse(err);
  }
}
