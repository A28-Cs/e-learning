import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";
import { recomputeCoursePrice } from "@/lib/courseHelpers";

export const dynamic = "force-dynamic";

// One-off migration helper: recompute price = sum(lesson prices) for every course.
// Needed once after introducing per-lesson pricing, since existing lessons have no
// price field yet (defaults to 0) — run this, then set prices on existing lessons.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb.collection("courses").get();
    const results = await Promise.all(
      snap.docs.map(async (d) => ({ id: d.id, price: await recomputeCoursePrice(d.id) }))
    );
    return Response.json({ ok: true, updated: results.length, results });
  } catch (err) {
    return errorResponse(err);
  }
}
