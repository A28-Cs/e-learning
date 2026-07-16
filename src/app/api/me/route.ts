import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, isAdminEmail, requireUser } from "@/lib/serverAuth";
import type { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ref = adminDb.collection("users").doc(user.uid);
    const snap = await ref.get();

    if (!snap.exists) {
      const role: Role = isAdminEmail(user.email) ? "admin" : "student";
      const profile = {
        name: user.name,
        email: user.email,
        role,
        enrolledCourses: [] as string[],
        createdAt: Date.now(),
      };
      await ref.set(profile);
      return Response.json({ ...profile, uid: user.uid, isAdmin: user.isAdmin, role });
    }

    const data = snap.data() ?? {};
    let role = (data.role as Role | undefined) ?? "student";
    if (isAdminEmail(user.email) && role !== "admin") {
      role = "admin";
      await ref.update({ role });
    }

    return Response.json({ ...data, uid: user.uid, isAdmin: user.isAdmin, role });
  } catch (err) {
    return errorResponse(err);
  }
}
