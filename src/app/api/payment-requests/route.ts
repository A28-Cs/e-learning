import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin, requireUser } from "@/lib/serverAuth";
import type { PaymentRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

// POST /api/payment-requests — student submits proof of a manual transfer
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const courseId = String(body.courseId ?? "");
    const method = String(body.method ?? "");
    const transactionRef = String(body.transactionRef ?? "").trim().slice(0, 120);
    const receiptUrl = String(body.receiptUrl ?? "").trim().slice(0, 500);

    if (method !== "vodafone_cash" && method !== "instapay") {
      return Response.json({ error: "bad_method" }, { status: 400 });
    }
    if (!receiptUrl) {
      return Response.json({ error: "missing_fields" }, { status: 400 });
    }

    const courseSnap = await adminDb.collection("courses").doc(courseId).get();
    if (!courseSnap.exists || courseSnap.data()!.published !== true) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }
    const course = courseSnap.data()!;

    const uSnap = await adminDb.collection("users").doc(user.uid).get();
    const enrolled = (uSnap.data()?.enrolledCourses ?? []) as string[];
    if (enrolled.includes(courseId)) {
      return Response.json({ error: "already_enrolled" }, { status: 400 });
    }

    // single equality filter only — avoids needing a composite Firestore index
    const mineSnap = await adminDb
      .collection("paymentRequests")
      .where("uid", "==", user.uid)
      .get();
    const hasPending = mineSnap.docs.some(
      (d) => d.data().courseId === courseId && d.data().status === "pending"
    );
    if (hasPending) {
      return Response.json({ error: "already_pending" }, { status: 400 });
    }

    const doc: Omit<PaymentRequest, "id"> = {
      uid: user.uid,
      email: user.email,
      name: user.name,
      courseId,
      courseTitleAr: course.titleAr,
      courseTitleEn: course.titleEn,
      amount: Number(course.price ?? 0),
      method,
      transactionRef,
      receiptUrl,
      status: "pending",
      adminNote: null,
      createdAt: Date.now(),
      reviewedAt: null,
      reviewedBy: null,
    };
    const ref = await adminDb.collection("paymentRequests").add(doc);
    return Response.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

// GET /api/payment-requests — admin list, newest first
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb
      .collection("paymentRequests")
      .orderBy("createdAt", "desc")
      .limit(300)
      .get();
    return Response.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    return errorResponse(err);
  }
}
