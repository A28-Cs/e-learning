import { NextRequest } from "next/server";
import { fulfillOrder, verifyWebhookHmac } from "@/lib/paymob";

export const dynamic = "force-dynamic";

// POST /api/pay/webhook?hmac=... — Paymob "transaction processed" callback.
// This is the source of truth for marking orders paid.
export async function POST(req: NextRequest) {
  try {
    const hmac = req.nextUrl.searchParams.get("hmac") ?? "";
    const body = await req.json();
    const obj = body?.obj as Record<string, unknown> | undefined;

    if (!obj || !verifyWebhookHmac(obj, hmac)) {
      return Response.json({ error: "invalid_hmac" }, { status: 401 });
    }

    const order = obj.order as Record<string, unknown> | undefined;
    const merchantOrderId = String(order?.merchant_order_id ?? "");

    if (obj.success === true && merchantOrderId) {
      await fulfillOrder(merchantOrderId, String(obj.id ?? ""));
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Paymob webhook error:", err);
    return Response.json({ error: "webhook_error" }, { status: 500 });
  }
}
