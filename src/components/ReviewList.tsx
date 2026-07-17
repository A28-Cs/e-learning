"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth, useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import ReviewForm from "./ReviewForm";
import ReviewCard from "./ReviewCard";

interface ReviewItem {
  uid: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: number;
}

const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export default function ReviewList({
  fetchUrl,
  postUrl,
  eligible,
  ineligibleMessage,
  onSubmitted,
  showList = true,
}: {
  fetchUrl: string;
  postUrl: string;
  eligible: boolean;
  ineligibleMessage?: string;
  onSubmitted?: () => void;
  showList?: boolean;
}) {
  const { t } = useLang();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(false);
  const [justSubmittedUid, setJustSubmittedUid] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ reviews: ReviewItem[] }>(fetchUrl);
      setReviews(res.reviews);
    } catch {
      setReviews([]);
    }
  }, [fetchUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const mine = user ? reviews?.find((r) => r.uid === user.uid) : undefined;

  const canEditMine = !mine || Date.now() - mine.createdAt <= EDIT_WINDOW_MS;

  async function submit(rating: number, comment: string) {
    setBusy(true);
    try {
      await api(postUrl, { method: "POST", body: { rating, comment } });
      await load();
      if (user) setJustSubmittedUid(user.uid);
      setToast(true);
      setTimeout(() => setToast(false), 2500);
      setTimeout(() => setJustSubmittedUid(null), 1200);
      onSubmitted?.();
    } finally {
      setBusy(false);
    }
  }

  async function removeMine() {
    if (!confirm(t("confirmDeleteReview"))) return;
    setBusy(true);
    try {
      await api(postUrl, { method: "DELETE" });
      await load();
      onSubmitted?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {eligible && user && canEditMine && (
        <ReviewForm
          key={mine?.uid ?? "new"}
          initialRating={mine?.rating ?? 0}
          initialComment={mine?.comment ?? ""}
          busy={busy}
          onSubmit={submit}
          submitLabel={mine ? t("updateReview") : t("submitReview")}
        />
      )}
      {eligible && user && mine && (
        <div className="flex items-center gap-3 text-sm">
          {!canEditMine && <span className="text-ink/50">{t("reviewEditClosed")}</span>}
          {canEditMine && (
            <button
              onClick={removeMine}
              disabled={busy}
              className="font-semibold text-red-600 hover:underline"
            >
              {t("deleteReview")}
            </button>
          )}
        </div>
      )}
      {!eligible && ineligibleMessage && (
        <p className="card p-4 text-center text-sm text-ink/50">{ineligibleMessage}</p>
      )}

      {showList &&
        (reviews === null ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="card h-24 animate-pulse bg-ink/5" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/40">{t("noReviewsYet")}</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <ReviewCard
                key={r.uid}
                name={r.name}
                rating={r.rating}
                comment={r.comment}
                createdAt={r.createdAt}
                className={`rise ${r.uid === justSubmittedUid ? "pop-in" : ""}`}
                style={{ animationDelay: `${Math.min(i * 60, 300)}ms` }}
              />
            ))}
          </div>
        ))}

      {toast && <div className="toast">{t("reviewSubmitted")}</div>}
    </div>
  );
}
