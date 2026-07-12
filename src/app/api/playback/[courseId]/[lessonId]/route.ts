import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, getAuthedUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/playback/[courseId]/[lessonId]
// Returns the MUX playback ID only if the lesson is free, or the user is
// enrolled in the course, or the user is an admin.
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    const lessonSnap = await adminDb
      .collection("courses")
      .doc(params.courseId)
      .collection("lessons")
      .doc(params.lessonId)
      .get();

    if (!lessonSnap.exists) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }
    const lesson = lessonSnap.data()!;

    let entitled = lesson.isFree === true;
    const user = await getAuthedUser(req);
    if (!entitled && user) {
      if (user.isAdmin) {
        entitled = true;
      } else {
        const uSnap = await adminDb.collection("users").doc(user.uid).get();
        const enrolled = (uSnap.data()?.enrolledCourses ?? []) as string[];
        entitled = enrolled.includes(params.courseId);
      }
    }

    if (!entitled) {
      return Response.json({ error: "not_entitled" }, { status: 403 });
    }

    return Response.json({
      playbackId: lesson.muxPlaybackId,
      titleAr: lesson.titleAr,
      titleEn: lesson.titleEn,
      status: lesson.status,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
