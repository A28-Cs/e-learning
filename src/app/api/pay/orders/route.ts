import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/pay/orders — admin list of payment orders (newest first)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb
      .collection("orders")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    return Response.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    return errorResponse(err);
  }
}
