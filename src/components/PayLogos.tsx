// Brand-evoking marks for the payment methods, drawn inline so the site
// stays fully self-hosted (no external image requests).

export function VodafoneLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="22" fill="#E60000" />
      <path
        d="M32.6 9.8c-4.5 1-7.9 3.2-10.1 6-2.1 2.7-3.3 6-3.3 9.3 0 5.6 3.9 10 9 10 4.8 0 8.6-3.9 8.6-8.8 0-4.3-3-7.6-7.2-8.3.5-3 2.7-5.8 5.8-7.2-.9-.6-1.8-1-2.8-1z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function InstaPayLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <rect width="48" height="48" rx="12" fill="#3B1E6E" />
      <path d="M27 7 13 27.5h8.4L19 41l16-21.5h-9.4L27 7z" fill="#F7941D" />
    </svg>
  );
}
