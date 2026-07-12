import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const ref = adminDb.collection("users").doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      const profile = {
        name: user.name,
        email: user.email,
        enrolledCourses: [] as string[],
        createdAt: Date.now(),
      };
      await ref.set(profile);
      return Response.json({ uid: user.uid, isAdmin: user.isAdmin, ...profile });
    }
    return Response.json({ uid: user.uid, isAdmin: user.isAdmin, ...snap.data() });
  } catch (err) {
    return errorResponse(err);
  }
}
