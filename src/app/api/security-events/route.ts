import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin, requireUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// POST /api/security-events — the watch page reports capture attempts
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const type = String(body.type ?? "");
    if (type !== "screenshot" && type !== "record") {
      return Response.json({ error: "bad_type" }, { status: 400 });
    }
    await adminDb.collection("securityEvents").add({
      uid: user.uid,
      email: user.email,
      type,
      courseId: String(body.courseId ?? "").slice(0, 100),
      lessonId: String(body.lessonId ?? "").slice(0, 100),
      seen: false,
      createdAt: Date.now(),
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

// GET /api/security-events — admin list (newest first); ?markSeen=1 clears the badge
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb
      .collection("securityEvents")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (req.nextUrl.searchParams.get("markSeen") === "1") {
      const unseen = snap.docs.filter((d) => d.data().seen === false);
      if (unseen.length > 0) {
        const batch = adminDb.batch();
        unseen.forEach((d) => batch.update(d.ref, { seen: true }));
        await batch.commit();
      }
    }
    return Response.json(events);
  } catch (err) {
    return errorResponse(err);
  }
}
