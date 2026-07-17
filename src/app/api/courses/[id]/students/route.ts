import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireCourseOwner } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/courses/[id]/students — course owner lists the students enrolled in it
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireCourseOwner(req, params.id);
    const snap = await adminDb
      .collection("users")
      .where("enrolledCourses", "array-contains", params.id)
      .get();
    const students = snap.docs.map((d) => {
      const u = d.data();
      return { uid: d.id, name: u.name ?? "", email: u.email ?? "" };
    });
    return Response.json(students);
  } catch (err) {
    return errorResponse(err);
  }
}
