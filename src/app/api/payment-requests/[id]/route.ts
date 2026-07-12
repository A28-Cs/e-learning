import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// PUT /api/payment-requests/[id] — admin approves or rejects a manual payment
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const action = String(body.action ?? "");
    if (action !== "approve" && action !== "reject") {
      return Response.json({ error: "bad_request" }, { status: 400 });
    }

    const reqRef = adminDb.collection("paymentRequests").doc(params.id);

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(reqRef);
      if (!snap.exists) throw new HttpError(404, "Not found");
      const data = snap.data()!;
      if (data.status !== "pending") throw new HttpError(400, "already_reviewed");

      if (action === "approve") {
        tx.update(reqRef, {
          status: "approved",
          reviewedAt: Date.now(),
          reviewedBy: admin.email,
          adminNote: null,
        });
        tx.set(
          adminDb.collection("users").doc(data.uid),
          { enrolledCourses: FieldValue.arrayUnion(data.courseId) },
          { merge: true }
        );
      } else {
        tx.update(reqRef, {
          status: "rejected",
          reviewedAt: Date.now(),
          reviewedBy: admin.email,
          adminNote: String(body.note ?? "").trim().slice(0, 300) || null,
        });
      }
    });

    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
