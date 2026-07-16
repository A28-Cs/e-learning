import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, getAuthedUser, requireCourseOwner } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/courses/[id] — course + lesson list (playback IDs stripped for non-admins)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ref = adminDb.collection("courses").doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }
    const course = snap.data()!;
    const user = await getAuthedUser(req);
    const isAdmin = !!user?.isAdmin;

    if (!course.published && !isAdmin) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }

    let enrolled = false;
    if (user && !isAdmin) {
      const uSnap = await adminDb.collection("users").doc(user.uid).get();
      const enrolledCourses = (uSnap.data()?.enrolledCourses ?? []) as string[];
      enrolled = enrolledCourses.includes(params.id);
    }

    const lessonsSnap = await ref.collection("lessons").orderBy("order").get();
    const lessons = lessonsSnap.docs.map((d) => {
      const l = d.data();
      const base = {
        id: d.id,
        titleAr: l.titleAr,
        titleEn: l.titleEn,
        order: l.order,
        isFree: l.isFree,
        price: l.price ?? 0,
        duration: l.duration,
        status: l.status,
      };
      return isAdmin
        ? { ...base, muxPlaybackId: l.muxPlaybackId, muxAssetId: l.muxAssetId }
        : base;
    });

    return Response.json({
      course: { id: snap.id, ...course },
      lessons,
      enrolled: enrolled || isAdmin,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// Note: `price` is intentionally never accepted here — it's always server-computed
// from lesson prices (see recomputeCoursePrice in courseHelpers.ts).
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireCourseOwner(req, params.id);
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    const strFields = ["titleAr", "titleEn", "descAr", "descEn", "categoryId", "thumbnail", "currency"];
    for (const f of strFields) {
      if (body[f] !== undefined) patch[f] = String(body[f]);
    }
    if (body.published !== undefined) patch.published = Boolean(body.published);
    if (body.featured !== undefined) patch.featured = Boolean(body.featured);
    await adminDb.collection("courses").doc(params.id).update(patch);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireCourseOwner(req, params.id);
    const ref = adminDb.collection("courses").doc(params.id);
    const lessons = await ref.collection("lessons").get();
    const batch = adminDb.batch();
    lessons.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(ref);
    await batch.commit();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
