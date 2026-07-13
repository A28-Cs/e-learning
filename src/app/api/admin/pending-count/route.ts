import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/admin/pending-count — badge numbers for the admin notification bell
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [payments, security] = await Promise.all([
      adminDb.collection("paymentRequests").where("status", "==", "pending").count().get(),
      adminDb.collection("securityEvents").where("seen", "==", false).count().get(),
    ]);
    return Response.json({
      payments: payments.data().count,
      security: security.data().count,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
