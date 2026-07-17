import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/admin/pending-count — badge numbers for the admin notification bell
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [payments, security, codeRequests, teachers, removals, support] = await Promise.all([
      adminDb.collection("paymentRequests").where("status", "==", "pending").count().get(),
      adminDb.collection("securityEvents").where("seen", "==", false).count().get(),
      adminDb.collection("codeRequests").where("status", "==", "pending").count().get(),
      adminDb.collection("users").where("teacherRequest", "==", "pending").count().get(),
      adminDb.collection("removalRequests").where("status", "==", "pending").count().get(),
      adminDb.collection("supportTickets").where("unreadByAdmin", "==", true).count().get(),
    ]);
    return Response.json({
      payments: payments.data().count,
      security: security.data().count,
      codeRequests: codeRequests.data().count,
      teachers: teachers.data().count,
      removals: removals.data().count,
      support: support.data().count,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
