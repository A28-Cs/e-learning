import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";
import type { TeacherPayout } from "@/lib/types";

export const dynamic = "force-dynamic";

// PUT /api/payouts/[id] — admin marks a payout paid (or unpaid). DELETE removes it.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const ref = adminDb.collection("teacherPayouts").doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) return Response.json({ error: "not_found" }, { status: 404 });

    const paid = body.status === "paid";
    const patch: Partial<TeacherPayout> = {
      status: paid ? "paid" : "owed",
      paidAt: paid ? Date.now() : null,
      paidBy: paid ? admin.email : null,
    };
    await ref.update(patch);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    await adminDb.collection("teacherPayouts").doc(params.id).delete();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
