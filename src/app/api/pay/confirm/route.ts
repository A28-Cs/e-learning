import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { fulfillOrder, verifyRedirectHmac } from "@/lib/paymob";

export const dynamic = "force-dynamic";

// POST /api/pay/confirm { params: {...} } — fallback fulfillment path.
// The payment-result page posts all query params Paymob appended on redirect;
// we verify the HMAC signature server-side before trusting them. This makes
// enrollment work even when the webhook can't reach us (e.g. localhost).
export async function POST(req: NextRequest) {
  try {
    const { params } = (await req.json()) as { params: Record<string, string> };
    if (!params || typeof params !== "object") {
      return Response.json({ error: "bad_request" }, { status: 400 });
    }

    const hmac = params.hmac ?? "";
    if (!hmac || !verifyRedirectHmac(params, hmac)) {
      return Response.json({ error: "invalid_hmac" }, { status: 401 });
    }

    const merchantOrderId = String(params.merchant_order_id ?? "");
    if (params.success === "true" && merchantOrderId) {
      const ok = await fulfillOrder(merchantOrderId, String(params.id ?? ""));
      if (ok) {
        const snap = await adminDb.collection("orders").doc(merchantOrderId).get();
        return Response.json({ status: "paid", courseId: snap.data()?.courseId ?? "" });
      }
    }
    return Response.json({ status: "failed" });
  } catch (err) {
    console.error("Paymob confirm error:", err);
    return Response.json({ error: "confirm_error" }, { status: 500 });
  }
}
