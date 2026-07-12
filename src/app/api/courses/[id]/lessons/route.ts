import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// POST /api/courses/[id]/lessons — admin adds a lesson (after MUX upload)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const courseRef = adminDb.collection("courses").doc(params.id);
    const courseSnap = await courseRef.get();
    if (!courseSnap.exists) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }
    const doc = {
      titleAr: String(body.titleAr ?? "").trim(),
      titleEn: String(body.titleEn ?? "").trim(),
      order: Number(body.order ?? Date.now()),
      isFree: Boolean(body.isFree ?? false),
      muxAssetId: String(body.muxAssetId ?? ""),
      muxPlaybackId: String(body.muxPlaybackId ?? ""),
      duration: Number(body.duration ?? 0),
      status: String(body.status ?? "ready"),
      createdAt: Date.now(),
    };
    if (!doc.titleAr || !doc.titleEn) {
      return Response.json({ error: "Titles are required" }, { status: 400 });
    }
    const ref = await courseRef.collection("lessons").add(doc);
    await courseRef.update({ lessonsCount: FieldValue.increment(1) });
    return Response.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
