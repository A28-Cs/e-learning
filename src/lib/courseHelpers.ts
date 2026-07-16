import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Course price is always the sum of its non-free lessons' prices.
 * Call this after any lesson add/edit/delete that could affect price or isFree.
 */
export async function recomputeCoursePrice(courseId: string): Promise<number> {
  const courseRef = adminDb.collection("courses").doc(courseId);
  const lessonsSnap = await courseRef.collection("lessons").get();
  const total = lessonsSnap.docs.reduce((sum, d) => {
    const l = d.data();
    if (l.isFree) return sum;
    return sum + Number(l.price ?? 0);
  }, 0);
  await courseRef.update({ price: total });
  return total;
}
