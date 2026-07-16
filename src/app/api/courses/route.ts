import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, getAuthedUser, requireTeacher } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/courses — public list (published only).
// Admins get everything with ?all=1. Teachers get their own (any status) with ?mine=1.
export async function GET(req: NextRequest) {
  try {
    const wantAll = req.nextUrl.searchParams.get("all") === "1";
    const wantMine = req.nextUrl.searchParams.get("mine") === "1";
    let showAll = false;
    let mineUid: string | null = null;
    if (wantAll) {
      const user = await getAuthedUser(req);
      showAll = !!user?.isAdmin;
    }
    if (wantMine) {
      const user = await getAuthedUser(req);
      if (user) mineUid = user.uid;
    }
    const snap = await adminDb
      .collection("courses")
      .orderBy("createdAt", "desc")
      .get();
    const courses = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Record<string, unknown>)
      .filter((c) => {
        if (mineUid) return c.teacherId === mineUid;
        return showAll || c.published === true;
      });
    return Response.json(courses);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireTeacher(req);
    const body = await req.json();
    const teacherId = user.isAdmin ? null : user.uid;
    const doc = {
      titleAr: String(body.titleAr ?? "").trim(),
      titleEn: String(body.titleEn ?? "").trim(),
      descAr: String(body.descAr ?? "").trim(),
      descEn: String(body.descEn ?? "").trim(),
      categoryId: String(body.categoryId ?? ""),
      teacherId,
      // Always server-computed from lessons — starts at 0, no lessons yet.
      price: 0,
      currency: String(body.currency ?? "EGP"),
      thumbnail: String(body.thumbnail ?? ""),
      published: Boolean(body.published ?? false),
      featured: Boolean(body.featured ?? false),
      lessonsCount: 0,
      createdAt: Date.now(),
    };
    if (!doc.titleAr || !doc.titleEn) {
      return Response.json({ error: "Titles are required" }, { status: 400 });
    }
    const ref = await adminDb.collection("courses").add(doc);
    return Response.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
