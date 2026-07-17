import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser } from "@/lib/serverAuth";
import { deleteReview, submitReview } from "@/lib/reviewHelpers";

export const dynamic = "force-dynamic";

// GET /api/courses/[id]/reviews — public list of course reviews
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const snap = await adminDb
      .collection("courses")
      .doc(params.id)
      .collection("reviews")
      .orderBy("createdAt", "desc")
      .get();
    return Response.json({ reviews: snap.docs.map((d) => d.data()) });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/courses/[id]/reviews — enrolled students leave/update a course review
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const rating = Number(body.rating);
    const comment = String(body.comment ?? "").trim().slice(0, 2000);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return Response.json({ error: "invalid_rating" }, { status: 400 });
    }

    const userRef = adminDb.collection("users").doc(user.uid);
    const uSnap = await userRef.get();
    const enrolledCourses = (uSnap.data()?.enrolledCourses ?? []) as string[];
    if (!user.isAdmin && !enrolledCourses.includes(params.id)) {
      return Response.json({ error: "not_enrolled" }, { status: 403 });
    }

    const courseRef = adminDb.collection("courses").doc(params.id);
    const reviewRef = courseRef.collection("reviews").doc(user.uid);
    await submitReview({
      parentRef: courseRef,
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

// DELETE /api/courses/[id]/reviews — author removes their own review (within 7 days)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    const courseRef = adminDb.collection("courses").doc(params.id);
    await deleteReview({
      parentRef: courseRef,
      reviewDocRef: courseRef.collection("reviews").doc(user.uid),
    });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
