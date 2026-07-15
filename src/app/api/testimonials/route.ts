import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/testimonials — public, recent platform testimonials for the landing page
export async function GET() {
  try {
    const snap = await adminDb
      .collection("testimonials")
      .orderBy("createdAt", "desc")
      .limit(12)
      .get();
    return Response.json({ reviews: snap.docs.map((d) => d.data()) });
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/testimonials — a student may leave one platform-wide testimonial,
// but only once they've completed an entire course. Never trust the client
// for eligibility — re-derive it from the student's own progress docs.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const rating = Number(body.rating);
    const comment = String(body.comment ?? "").trim().slice(0, 2000);
    const lang = body.lang === "en" ? "en" : "ar";
    if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !comment) {
      return Response.json({ error: "invalid_input" }, { status: 400 });
    }

    const progressSnap = await adminDb
      .collection("users")
      .doc(user.uid)
      .collection("progress")
      .where("completed", "==", true)
      .limit(1)
      .get();
    if (progressSnap.empty) {
      return Response.json({ error: "not_eligible" }, { status: 403 });
    }
    const courseId = progressSnap.docs[0].id;

    const uSnap = await adminDb.collection("users").doc(user.uid).get();
    const name = (uSnap.data()?.name as string) || user.name || "";
    const now = Date.now();
    const ref = adminDb.collection("testimonials").doc(user.uid);
    const existing = await ref.get();
    await ref.set(
      {
        uid: user.uid,
        name,
        rating,
        comment,
        lang,
        courseId,
        createdAt: existing.exists ? existing.data()!.createdAt : now,
        updatedAt: now,
      },
      { merge: true }
    );

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
