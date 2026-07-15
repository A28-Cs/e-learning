import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/progress/[courseId] — the calling student's own progress for a course
export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const user = await requireUser(req);
    const snap = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("progress")
      .doc(params.courseId)
      .get();

    if (!snap.exists) {
      return Response.json({
        courseId: params.courseId,
        completedLessons: [],
        completed: false,
        completedAt: null,
      });
    }
    return Response.json(snap.data());
  } catch (err) {
    return errorResponse(err);
  }
}
