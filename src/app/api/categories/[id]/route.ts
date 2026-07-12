import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    if (body.nameAr !== undefined) patch.nameAr = String(body.nameAr).trim();
    if (body.nameEn !== undefined) patch.nameEn = String(body.nameEn).trim();
    if (body.order !== undefined) patch.order = Number(body.order);
    await adminDb.collection("categories").doc(params.id).update(patch);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    await adminDb.collection("categories").doc(params.id).delete();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
