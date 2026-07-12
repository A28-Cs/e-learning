import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser } from "@/lib/serverAuth";
import type { PaymentRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/payment-requests/mine?courseId=... — latest request for this student+course
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const courseId = req.nextUrl.searchParams.get("courseId") ?? "";

    const snap = await adminDb
      .collection("paymentRequests")
      .where("uid", "==", user.uid)
      .get();

    const mine = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as PaymentRequest)
      .filter((r) => r.courseId === courseId)
      .sort((a, b) => b.createdAt - a.createdAt);

    return Response.json(mine[0] ?? null);
  } catch (err) {
    return errorResponse(err);
  }
}
