"use client";

import { useState } from "react";
import StarRating from "./StarRating";
import { useLang } from "@/context/AppProviders";

export default function ReviewForm({
  initialRating = 0,
  initialComment = "",
  busy,
  onSubmit,
  submitLabel,
}: {
  initialRating?: number;
  initialComment?: string;
  busy?: boolean;
  onSubmit: (rating: number, comment: string) => void;
  submitLabel?: string;
}) {
  const { t } = useLang();
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (rating > 0) onSubmit(rating, comment.trim());
      }}
      className="card space-y-3 p-5"
    >
      <StarRating value={rating} onChange={setRating} size="lg" />
      <textarea
        className="input min-h-[90px] resize-none"
        placeholder={t("reviewPlaceholder")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={2000}
      />
      <button type="submit" className="btn-primary" disabled={busy || rating === 0}>
        {busy ? t("loading") : submitLabel ?? t("submitReview")}
      </button>
    </form>
  );
}
