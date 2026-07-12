import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await adminDb.collection("categories").orderBy("order").get();
    return Response.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const doc = {
      nameAr: String(body.nameAr ?? "").trim(),
      nameEn: String(body.nameEn ?? "").trim(),
      order: Number(body.order ?? 0),
    };
    if (!doc.nameAr || !doc.nameEn) {
      return Response.json({ error: "Both names are required" }, { status: 400 });
    }
    const ref = await adminDb.collection("categories").add(doc);
    return Response.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
