import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";
import type { RemovalRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

// PUT /api/removal-requests/[id] — admin reviews a removal request.
// actions: contact (mark student contacted), approve (unenroll the student), reject
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const action = String(body.action ?? "");

    const ref = adminDb.collection("removalRequests").doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) return Response.json({ error: "not_found" }, { status: 404 });
    const request = snap.data() as Omit<RemovalRequest, "id">;

    const base = {
      reviewedAt: Date.now(),
      reviewedBy: admin.email,
      adminNote: body.adminNote ? String(body.adminNote) : request.adminNote ?? null,
    };

    if (action === "contact") {
      await ref.update({ status: "contacted_student", adminNote: base.adminNote });
      return Response.json({ ok: true });
    }

    if (action === "approve") {
      if (request.status === "approved") {
        return Response.json({ error: "already_reviewed" }, { status: 409 });
      }
      // Remove the course from the student's enrollment.
      await adminDb
        .collection("users")
        .doc(request.studentUid)
        .set(
          { enrolledCourses: FieldValue.arrayRemove(request.courseId) },
          { merge: true }
        );
      await ref.update({ ...base, status: "approved" });
      return Response.json({ ok: true });
    }

    if (action === "reject") {
      await ref.update({ ...base, status: "rejected" });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "bad_request" }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
