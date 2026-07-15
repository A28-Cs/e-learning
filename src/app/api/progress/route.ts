import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser, HttpError } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// POST /api/progress — mark a lesson as completed for the calling student
// (called once the lesson's video finishes playing). Re-checks entitlement
// server-side and rolls the course up to "completed" once every lesson is done.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const courseId = String(body.courseId ?? "");
    const lessonId = String(body.lessonId ?? "");
    if (!courseId || !lessonId) {
      return Response.json({ error: "invalid_request" }, { status: 400 });
    }

    const courseRef = adminDb.collection("courses").doc(courseId);
    const lessonRef = courseRef.collection("lessons").doc(lessonId);
    const userRef = adminDb.collection("users").doc(user.uid);
    const progressRef = userRef.collection("progress").doc(courseId);

    const progress = await adminDb.runTransaction(async (tx) => {
      const [courseSnap, lessonSnap, userSnap, progressSnap] = await Promise.all([
        tx.get(courseRef),
        tx.get(lessonRef),
        tx.get(userRef),
        tx.get(progressRef),
      ]);
      if (!courseSnap.exists || !lessonSnap.exists) throw new HttpError(404, "not_found");

      const lesson = lessonSnap.data()!;
      const enrolledCourses = (userSnap.data()?.enrolledCourses ?? []) as string[];
      const entitled = user.isAdmin || lesson.isFree === true || enrolledCourses.includes(courseId);
      if (!entitled) throw new HttpError(403, "not_entitled");

      const prevCompleted = (progressSnap.data()?.completedLessons ?? []) as string[];
      const completedLessons = prevCompleted.includes(lessonId)
        ? prevCompleted
        : [...prevCompleted, lessonId];

      const lessonsCount = (courseSnap.data()!.lessonsCount as number) ?? 0;
      const completed = lessonsCount > 0 && completedLessons.length >= lessonsCount;
      const now = Date.now();

      const data = {
        courseId,
        completedLessons,
        completed,
        completedAt: completed ? (progressSnap.data()?.completedAt as number) ?? now : null,
        updatedAt: now,
      };
      tx.set(progressRef, data, { merge: true });
      return data;
    });

    return Response.json({ ok: true, progress });
  } catch (err) {
    return errorResponse(err);
  }
}
