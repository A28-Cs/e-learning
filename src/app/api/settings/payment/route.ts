import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";
import type { PaymentSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEFAULTS: PaymentSettings = { vodafoneCash: "", instapay: "", enabled: false };

// GET /api/settings/payment — public, drives the manual-payment box on course pages
export async function GET() {
  try {
    const snap = await adminDb.collection("settings").doc("payment").get();
    return Response.json(snap.exists ? { ...DEFAULTS, ...snap.data() } : DEFAULTS);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const patch: PaymentSettings = {
      vodafoneCash: String(body.vodafoneCash ?? "").trim(),
      instapay: String(body.instapay ?? "").trim(),
      enabled: Boolean(body.enabled ?? false),
    };
    await adminDb.collection("settings").doc("payment").set(patch, { merge: true });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
