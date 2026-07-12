import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [courses, users, usedCodes] = await Promise.all([
      adminDb.collection("courses").get(),
      adminDb.collection("users").count().get(),
      adminDb.collection("activationCodes").where("used", "==", true).count().get(),
    ]);
    const lessons = courses.docs.reduce(
      (sum, d) => sum + Number(d.data().lessonsCount ?? 0),
      0
    );
    return Response.json({
      courses: courses.size,
      students: users.data().count,
      codesUsed: usedCodes.data().count,
      lessons,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
