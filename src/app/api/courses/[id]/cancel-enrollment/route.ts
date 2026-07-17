import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// POST /api/courses/[id]/cancel-enrollment — a student unenrolls from a course
// they haven't started watching yet (no completed lessons).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    const userRef = adminDb.collection("users").doc(user.uid);
    const [userSnap, progressSnap] = await Promise.all([
      userRef.get(),
      userRef.collection("progress").doc(params.id).get(),
    ]);

    const enrolled = (userSnap.data()?.enrolledCourses ?? []) as string[];
    if (!enrolled.includes(params.id)) {
      return Response.json({ error: "not_enrolled" }, { status: 400 });
    }

    const completed = (progressSnap.data()?.completedLessons ?? []) as string[];
    if (completed.length > 0) {
      return Response.json({ error: "already_started" }, { status: 403 });
    }

    await userRef.set(
      { enrolledCourses: FieldValue.arrayRemove(params.id) },
      { merge: true }
    );
    await adminDb.collection("enrollmentCancellations").add({
      uid: user.uid,
      email: user.email,
      courseId: params.id,
      createdAt: Date.now(),
    });

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
