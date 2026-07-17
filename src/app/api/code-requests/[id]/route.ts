import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";
import { randomActivationCode } from "@/lib/courseHelpers";
import type { CodeRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

// PUT /api/code-requests/[id] — admin approves (generates a restricted code) or rejects
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const action = String(body.action ?? "");

    const ref = adminDb.collection("codeRequests").doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const request = snap.data() as Omit<CodeRequest, "id">;
    if (request.status !== "pending") {
      return Response.json({ error: "already_reviewed" }, { status: 409 });
    }

    const base = {
      reviewedAt: Date.now(),
      reviewedBy: admin.email,
      adminNote: body.adminNote ? String(body.adminNote) : null,
    };

    if (action === "approve") {
      // Generate a code locked to this student + course so no one else can redeem it.
      const code = randomActivationCode();
      await adminDb.collection("activationCodes").doc(code).set({
        courseId: request.courseId,
        used: false,
        usedBy: null,
        usedByEmail: null,
        createdAt: Date.now(),
        usedAt: null,
        restrictedToUid: request.studentUid ?? null,
        restrictedToEmail: request.studentEmail,
      });
      await ref.update({ ...base, status: "approved", code });
      return Response.json({ ok: true, code });
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
