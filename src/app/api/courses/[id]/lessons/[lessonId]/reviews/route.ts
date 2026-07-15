import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser } from "@/lib/serverAuth";
import { submitReview } from "@/lib/reviewHelpers";

export const dynamic = "force-dynamic";

// GET /api/courses/[id]/lessons/[lessonId]/reviews — public list of lesson reviews
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const snap = await adminDb
      .collection("courses")
      .doc(params.id)
      .collection("lessons")
      .doc(params.lessonId)
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .get();
    return Response.json({ reviews: snap.docs.map((d) => d.data()) });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/courses/[id]/lessons/[lessonId]/reviews — same entitlement rule as playback:
// enrolled in the course, the lesson is free, or admin.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const rating = Number(body.rating);
    const comment = String(body.comment ?? "").trim().slice(0, 2000);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return Response.json({ error: "invalid_rating" }, { status: 400 });
    }

    const lessonRef = adminDb
      .collection("courses")
      .doc(params.id)
      .collection("lessons")
      .doc(params.lessonId);
    const lessonSnap = await lessonRef.get();
    if (!lessonSnap.exists) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const userRef = adminDb.collection("users").doc(user.uid);
    const uSnap = await userRef.get();
    const enrolledCourses = (uSnap.data()?.enrolledCourses ?? []) as string[];
    const entitled =
      user.isAdmin || lessonSnap.data()!.isFree === true || enrolledCourses.includes(params.id);
    if (!entitled) {
      return Response.json({ error: "not_entitled" }, { status: 403 });
    }

    const reviewRef = lessonRef.collection("reviews").doc(user.uid);
    await submitReview({
      parentRef: lessonRef,
      reviewDocRef: reviewRef,
      uid: user.uid,
      name: (uSnap.data()?.name as string) || user.name || "",
      rating,
      comment,
    });

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
