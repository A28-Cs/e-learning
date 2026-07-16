import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["admin", "teacher", "student"];

// When an admin sets a role, keep the teacherRequest flag consistent:
// promoting to teacher marks it approved; anything else clears any pending flag.
function teacherRequestFor(role: Role) {
  return role === "teacher" ? "approved" : FieldValue.delete();
}

export const dynamic = "force-dynamic";

// GET /api/admin/students/[uid] — full student profile:
// info + enrollments + payment requests + redeemed codes + Paymob orders
export async function GET(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    await requireAdmin(req);
    const uSnap = await adminDb.collection("users").doc(params.uid).get();
    if (!uSnap.exists) {
      return Response.json({ error: "Student not found" }, { status: 404 });
    }
    const user = uSnap.data()!;
    const enrolledIds = (user.enrolledCourses ?? []) as string[];

    const [coursesSnap, prSnap, codesSnap, ordersSnap] = await Promise.all([
      adminDb.collection("courses").get(),
      adminDb.collection("paymentRequests").where("uid", "==", params.uid).get(),
      adminDb.collection("activationCodes").where("usedBy", "==", params.uid).get(),
      adminDb.collection("orders").where("uid", "==", params.uid).get(),
    ]);

    const courseTitle = new Map(
      coursesSnap.docs.map((d) => [
        d.id,
        { titleAr: d.data().titleAr as string, titleEn: d.data().titleEn as string },
      ])
    );

    const byNewest = (a: { createdAt?: number }, b: { createdAt?: number }) =>
      Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0);

    return Response.json({
      student: {
        uid: params.uid,
        name: user.name ?? "",
        email: user.email ?? "",
        role: (user.role as Role | undefined) ?? "student",
        teacherRequest: (user.teacherRequest as string | undefined) ?? null,
        createdAt: Number(user.createdAt ?? 0),
      },
      enrollments: enrolledIds.map((id) => ({
        courseId: id,
        titleAr: courseTitle.get(id)?.titleAr ?? id,
        titleEn: courseTitle.get(id)?.titleEn ?? id,
      })),
      allCourses: coursesSnap.docs.map((d) => ({
        id: d.id,
        titleAr: d.data().titleAr,
        titleEn: d.data().titleEn,
      })),
      paymentRequests: prSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
        .sort(byNewest),
      codes: codesSnap.docs
        .map((d) => ({ code: d.id, ...d.data() }) as Record<string, unknown>)
        .sort(byNewest),
      orders: ordersSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
        .sort(byNewest),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT /api/admin/students/[uid] — grant/revoke a course, or set a user's role
export async function PUT(req: NextRequest, { params }: { params: { uid: string } }) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "setRole") {
      const role = String(body.role ?? "") as Role;
      if (!ROLES.includes(role)) {
        return Response.json({ error: "bad_request" }, { status: 400 });
      }
      await adminDb
        .collection("users")
        .doc(params.uid)
        .set({ role, teacherRequest: teacherRequestFor(role) }, { merge: true });
      return Response.json({ ok: true });
    }

    // Approve/reject a pending teacher request without a full role dropdown.
    if (action === "approveTeacher" || action === "rejectTeacher") {
      const patch =
        action === "approveTeacher"
          ? { role: "teacher", teacherRequest: "approved" }
          : { teacherRequest: "rejected" };
      await adminDb.collection("users").doc(params.uid).set(patch, { merge: true });
      return Response.json({ ok: true });
    }

    const courseId = String(body.courseId ?? "");
    if (!courseId || (action !== "grant" && action !== "revoke")) {
      return Response.json({ error: "bad_request" }, { status: 400 });
    }
    await adminDb
      .collection("users")
      .doc(params.uid)
      .set(
        {
          enrolledCourses:
            action === "grant"
              ? FieldValue.arrayUnion(courseId)
              : FieldValue.arrayRemove(courseId),
        },
        { merge: true }
      );
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
