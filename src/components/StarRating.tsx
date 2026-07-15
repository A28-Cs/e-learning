"use client";

const SIZES = { sm: "text-sm", md: "text-lg", lg: "text-2xl" } as const;

export default function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: keyof typeof SIZES;
}) {
  const readOnly = !onChange;

  return (
    <div className={`inline-flex items-center gap-0.5 ${SIZES[size]}`} dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            className={`leading-none transition-transform ${
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"
            } ${filled ? "text-amber-500" : "text-ink/15"}`}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
