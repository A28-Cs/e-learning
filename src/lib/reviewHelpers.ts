import type { DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { HttpError } from "@/lib/serverAuth";

// Writes/overwrites a single review doc (doc id = uid) and keeps the
// denormalized ratingCount/ratingSum/ratingAvg on the parent doc in sync,
// in one transaction — so resubmitting a review adjusts the average by the
// delta instead of double-counting it.
export async function submitReview(params: {
  parentRef: DocumentReference;
  reviewDocRef: DocumentReference;
  uid: string;
  name: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const { parentRef, reviewDocRef, uid, name, rating, comment } = params;
  const now = Date.now();

  await adminDb.runTransaction(async (tx) => {
    const [parentSnap, reviewSnap] = await Promise.all([tx.get(parentRef), tx.get(reviewDocRef)]);
    if (!parentSnap.exists) throw new HttpError(404, "not_found");

    const parent = parentSnap.data()!;
    const prevRating = reviewSnap.exists ? (reviewSnap.data()!.rating as number) : 0;
    const prevCount = reviewSnap.exists ? 1 : 0;

    const ratingCount = ((parent.ratingCount as number) ?? 0) - prevCount + 1;
    const ratingSum = ((parent.ratingSum as number) ?? 0) - prevRating + rating;
    const ratingAvg = ratingCount > 0 ? ratingSum / ratingCount : 0;

    tx.set(
      reviewDocRef,
      {
        uid,
        name,
        rating,
        comment,
        createdAt: reviewSnap.exists ? reviewSnap.data()!.createdAt : now,
        updatedAt: now,
      },
      { merge: true }
    );
    tx.update(parentRef, { ratingCount, ratingSum, ratingAvg });
  });
}
