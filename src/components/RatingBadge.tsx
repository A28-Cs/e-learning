export default function RatingBadge({ avg, count }: { avg?: number; count?: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-600">
      <span aria-hidden>★</span>
      <span>{(avg ?? 0).toFixed(1)}</span>
      <span className="font-normal text-amber-600/70">({count})</span>
    </span>
  );
}
