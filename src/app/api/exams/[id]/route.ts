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
import type { Exam, ExamQuestion, QuestionType } from "@/lib/types";

export const dynamic = "force-dynamic";

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// Normalize an incoming question so clients can't store malformed data.
function normalizeQuestion(raw: unknown): ExamQuestion {
  const q = (raw ?? {}) as Record<string, unknown>;
  const type: QuestionType = q.type === "essay" ? "essay" : "mcq";
  const base: ExamQuestion = {
    id: typeof q.id === "string" && q.id ? q.id : randomId(),
    type,
    text: String(q.text ?? ""),
    points: Math.max(0, Number(q.points ?? 1) || 0),
  };
  if (type === "mcq") {
    const options = Array.isArray(q.options) ? q.options.map((o) => String(o)) : [];
    base.options = options;
    const idx = Number(q.correctIndex);
    base.correctIndex = Number.isInteger(idx) && idx >= 0 && idx < options.length ? idx : 0;
  }
  return base;
}

async function loadExam(id: string): Promise<(Exam & { ref: FirebaseFirestore.DocumentReference }) | null> {
  const ref = adminDb.collection("exams").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...(snap.data() as Omit<Exam, "id">), ref };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const exam = await loadExam(params.id);
    if (!exam) return Response.json({ error: "not_found" }, { status: 404 });
    const user = await requireUser(req);

    const isOwner =
      user.isAdmin ||
      ((await getStoredRole(user.uid)) === "teacher" && exam.teacherId === user.uid);

    const { ref, ...data } = exam;
    void ref;
    if (isOwner) return Response.json(data);

    if (!exam.published || !(await isEnrolled(user.uid, exam.courseId))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    return Response.json(sanitizeExam(data));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const exam = await loadExam(params.id);
    if (!exam) return Response.json({ error: "not_found" }, { status: 404 });
    await requireCourseOwner(req, exam.courseId);

    const body = await req.json();
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (body.title !== undefined) patch.title = String(body.title);
    if (body.instructions !== undefined) patch.instructions = String(body.instructions);
    if (body.published !== undefined) patch.published = Boolean(body.published);
    if (Array.isArray(body.questions)) {
      patch.questions = body.questions.map(normalizeQuestion);
    }
    await exam.ref.update(patch);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const exam = await loadExam(params.id);
    if (!exam) return Response.json({ error: "not_found" }, { status: 404 });
    await requireCourseOwner(req, exam.courseId);
    await exam.ref.delete();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
