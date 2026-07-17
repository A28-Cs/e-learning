import type { DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { HttpError } from "@/lib/serverAuth";

// A review can be edited or deleted by its author only within 7 days of posting.
export const REVIEW_EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function withinEditWindow(createdAt: number): boolean {
  return Date.now() - createdAt <= REVIEW_EDIT_WINDOW_MS;
}

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
    // Editing an existing review is only allowed inside the 7-day window.
    if (reviewSnap.exists && !withinEditWindow(reviewSnap.data()!.createdAt as number)) {
      throw new HttpError(403, "edit_window_closed");
    }
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

// Deletes the author's review (within the 7-day window) and rolls back the
// denormalized rating aggregates on the parent in the same transaction.
export async function deleteReview(params: {
  parentRef: DocumentReference;
  reviewDocRef: DocumentReference;
}): Promise<void> {
  const { parentRef, reviewDocRef } = params;

  await adminDb.runTransaction(async (tx) => {
    const [parentSnap, reviewSnap] = await Promise.all([tx.get(parentRef), tx.get(reviewDocRef)]);
    if (!reviewSnap.exists) throw new HttpError(404, "not_found");
    if (!withinEditWindow(reviewSnap.data()!.createdAt as number)) {
      throw new HttpError(403, "edit_window_closed");
    }

    const parent = parentSnap.data() ?? {};
    const prevRating = reviewSnap.data()!.rating as number;
    const ratingCount = Math.max(0, ((parent.ratingCount as number) ?? 0) - 1);
    const ratingSum = Math.max(0, ((parent.ratingSum as number) ?? 0) - prevRating);
    const ratingAvg = ratingCount > 0 ? ratingSum / ratingCount : 0;

    tx.delete(reviewDocRef);
    tx.update(parentRef, { ratingCount, ratingSum, ratingAvg });
  });
}
