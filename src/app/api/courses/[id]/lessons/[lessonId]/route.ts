import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireCourseOwner } from "@/lib/serverAuth";
import { recomputeCoursePrice } from "@/lib/courseHelpers";
import { mux } from "@/lib/mux";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    await requireCourseOwner(req, params.id);
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    if (body.titleAr !== undefined) patch.titleAr = String(body.titleAr);
    if (body.titleEn !== undefined) patch.titleEn = String(body.titleEn);
    if (body.order !== undefined) patch.order = Number(body.order);
    if (body.isFree !== undefined) patch.isFree = Boolean(body.isFree);
    if (body.price !== undefined) patch.price = Number(body.price);
    if (patch.isFree === true) patch.price = 0;
    if (body.muxAssetId !== undefined) patch.muxAssetId = String(body.muxAssetId);
    if (body.muxPlaybackId !== undefined) patch.muxPlaybackId = String(body.muxPlaybackId);
    if (body.duration !== undefined) patch.duration = Number(body.duration);
    if (body.status !== undefined) patch.status = String(body.status);
    await adminDb
      .collection("courses")
      .doc(params.id)
      .collection("lessons")
      .doc(params.lessonId)
      .update(patch);
    if (patch.isFree !== undefined || patch.price !== undefined) {
      await recomputeCoursePrice(params.id);
    }
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    await requireCourseOwner(req, params.id);
    const courseRef = adminDb.collection("courses").doc(params.id);
    const lessonRef = courseRef.collection("lessons").doc(params.lessonId);
    const snap = await lessonRef.get();
    if (snap.exists) {
      const assetId = snap.data()?.muxAssetId as string | undefined;
      if (assetId) {
        // best-effort cleanup of the MUX asset
        try {
          await mux.video.assets.delete(assetId);
        } catch {
          /* asset may already be gone */
        }
      }
      await lessonRef.delete();
      await courseRef.update({ lessonsCount: FieldValue.increment(-1) });
      await recomputeCoursePrice(params.id);
    }
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
