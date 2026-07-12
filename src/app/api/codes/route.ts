import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/O/1/I

function randomCode(): string {
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    if (i === 3) s += "-";
  }
  return s;
}

// GET /api/codes?courseId=... — list codes (admin)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const courseId = req.nextUrl.searchParams.get("courseId");
    let query: FirebaseFirestore.Query = adminDb.collection("activationCodes");
    if (courseId) query = query.where("courseId", "==", courseId);
    const snap = await query.get();
    const codes = snap.docs
      .map((d) => ({ code: d.id, ...d.data() }) as Record<string, unknown>)
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    return Response.json(codes);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/codes — generate N codes for a course (admin)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const courseId = String(body.courseId ?? "");
    const count = Math.min(Math.max(Number(body.count ?? 1), 1), 200);
    if (!courseId) {
      return Response.json({ error: "courseId is required" }, { status: 400 });
    }
    const courseSnap = await adminDb.collection("courses").doc(courseId).get();
    if (!courseSnap.exists) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }
    const batch = adminDb.batch();
    const created: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = randomCode();
      created.push(code);
      batch.set(adminDb.collection("activationCodes").doc(code), {
        courseId,
        used: false,
        usedBy: null,
        usedByEmail: null,
        createdAt: Date.now(),
        usedAt: null,
      });
    }
    await batch.commit();
    return Response.json({ codes: created }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
