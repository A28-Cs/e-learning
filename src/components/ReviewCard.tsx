import type { CSSProperties } from "react";
import StarRating from "./StarRating";

export default function ReviewCard({
  name,
  rating,
  comment,
  createdAt,
  className = "",
  style,
}: {
  name: string;
  rating: number;
  comment: string;
  createdAt: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`card p-5 ${className}`} style={style}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-moss-500/10 font-display font-bold text-moss-600">
            {(name || "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <div className="text-sm font-bold">{name || "—"}</div>
            <div className="text-xs text-ink/40">{new Date(createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <StarRating value={rating} size="sm" />
      </div>
      {comment && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/70">{comment}</p>
      )}
    </div>
  );
}
