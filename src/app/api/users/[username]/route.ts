import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse } from "@/lib/serverAuth";
import type { Course, Role } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/users/[username] — public profile by handle (safe fields only).
// Teachers also expose their published courses.
export async function GET(_req: NextRequest, { params }: { params: { username: string } }) {
  try {
    const username = params.username.toLowerCase();
    const handleSnap = await adminDb.collection("usernames").doc(username).get();
    if (!handleSnap.exists) return Response.json({ error: "not_found" }, { status: 404 });

    const uid = handleSnap.data()!.uid as string;
    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (!userSnap.exists) return Response.json({ error: "not_found" }, { status: 404 });
    const u = userSnap.data()!;
    const role = (u.role as Role | undefined) ?? "student";

    const profile = {
      uid,
      name: (u.name as string) ?? "",
      username: (u.username as string) ?? username,
      bio: (u.bio as string) ?? "",
      photoURL: (u.photoURL as string) ?? "",
      phone: (u.phone as string) ?? "",
      role,
      createdAt: Number(u.createdAt ?? 0),
    };

    let courses: Pick<Course, "id" | "titleAr" | "titleEn" | "thumbnail" | "price" | "currency">[] = [];
    if (role === "teacher") {
      const snap = await adminDb
        .collection("courses")
        .where("teacherId", "==", uid)
        .where("published", "==", true)
        .get();
      courses = snap.docs.map((d) => {
        const c = d.data();
        return {
          id: d.id,
          titleAr: c.titleAr,
          titleEn: c.titleEn,
          thumbnail: c.thumbnail ?? "",
          price: c.price ?? 0,
          currency: c.currency ?? "EGP",
        };
      });
    }

    return Response.json({ profile, courses });
  } catch (err) {
    return errorResponse(err);
  }
}
