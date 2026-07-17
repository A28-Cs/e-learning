import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// POST /api/codes/redeem — student redeems an activation code
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const code = String(body.code ?? "").trim().toUpperCase();
    if (!code) {
      return Response.json({ error: "Code is required" }, { status: 400 });
    }

    const codeRef = adminDb.collection("activationCodes").doc(code);
    const userRef = adminDb.collection("users").doc(user.uid);

    const courseId = await adminDb.runTransaction(async (tx) => {
      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists || codeSnap.data()!.used) return null;
      const data = codeSnap.data()!;
      // Codes issued through a teacher request are locked to one student.
      const restrictUid = data.restrictedToUid as string | null | undefined;
      const restrictEmail = data.restrictedToEmail as string | null | undefined;
      if (restrictUid && restrictUid !== user.uid) return "restricted";
      if (
        restrictEmail &&
        restrictEmail.toLowerCase() !== (user.email ?? "").toLowerCase()
      ) {
        return "restricted";
      }
      const cid = data.courseId as string;
      tx.update(codeRef, {
        used: true,
        usedBy: user.uid,
        usedByEmail: user.email,
        usedAt: Date.now(),
      });
      tx.set(
        userRef,
        {
          name: user.name,
          email: user.email,
          enrolledCourses: FieldValue.arrayUnion(cid),
        },
        { merge: true }
      );
      return cid;
    });

    if (courseId === "restricted") {
      return Response.json({ error: "code_restricted" }, { status: 403 });
    }
    if (!courseId) {
      return Response.json({ error: "invalid_code" }, { status: 400 });
    }
    return Response.json({ ok: true, courseId });
  } catch (err) {
    return errorResponse(err);
  }
}
