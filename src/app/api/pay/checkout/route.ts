import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser } from "@/lib/serverAuth";
import { createPaymobCheckout, paymentsEnabled } from "@/lib/paymob";

export const dynamic = "force-dynamic";

// POST /api/pay/checkout { courseId } — creates a pending order and returns
// the Paymob Unified Checkout URL to redirect the student to.
export async function POST(req: NextRequest) {
  try {
    if (!paymentsEnabled()) {
      return Response.json({ error: "payments_not_configured" }, { status: 503 });
    }
    const user = await requireUser(req);
    const { courseId } = await req.json();

    const courseSnap = await adminDb.collection("courses").doc(String(courseId)).get();
    if (!courseSnap.exists || courseSnap.data()!.published !== true) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }
    const course = courseSnap.data()!;
    const price = Number(course.price ?? 0);
    if (price <= 0) {
      return Response.json({ error: "Course is free" }, { status: 400 });
    }

    // already enrolled?
    const uSnap = await adminDb.collection("users").doc(user.uid).get();
    const enrolled = (uSnap.data()?.enrolledCourses ?? []) as string[];
    if (enrolled.includes(String(courseId))) {
      return Response.json({ error: "already_enrolled" }, { status: 400 });
    }

    const amountCents = Math.round(price * 100);
    const orderRef = adminDb.collection("orders").doc();
    await orderRef.set({
      uid: user.uid,
      email: user.email,
      courseId: String(courseId),
      courseTitleAr: course.titleAr,
      courseTitleEn: course.titleEn,
      amountCents,
      status: "pending",
      paymobTransactionId: null,
      createdAt: Date.now(),
      paidAt: null,
    });

    const url = await createPaymobCheckout({
      orderId: orderRef.id,
      amountCents,
      itemName: String(course.titleEn || course.titleAr),
      email: user.email,
      name: user.name,
    });

    return Response.json({ url, orderId: orderRef.id });
  } catch (err) {
    return errorResponse(err);
  }
}
