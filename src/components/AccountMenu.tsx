"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useLang } from "@/context/AppProviders";

// Professional account dropdown: avatar button that opens a menu with the
// user's identity and quick links, replacing the bare logout button.
export default function AccountMenu() {
  const { t } = useLang();
  const { user, profile, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Close when navigating.
  useEffect(() => setOpen(false), [pathname]);

  if (!user) return null;

  const name = profile?.name || user.email || "";
  const initial = (name || "?").charAt(0).toUpperCase();
  const photo = profile?.photoURL;

  const menuLinks = [
    { href: "/profile", label: t("navProfile"), icon: "👤" },
    { href: "/my-courses", label: t("navMyCourses"), icon: "▤" },
    { href: "/support", label: t("navSupport"), icon: "💬" },
    ...(profile?.role === "teacher"
      ? [{ href: "/teacher", label: t("navTeacher"), icon: "◫" }]
      : []),
    ...(profile?.isAdmin ? [{ href: "/admin", label: t("navAdmin"), icon: "⚙" }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-ink/15 py-1 pe-3 ps-1 transition-colors hover:border-moss-500"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-moss-500/10 font-display text-sm font-bold text-moss-600">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </span>
        <span className="hidden max-w-24 truncate text-xs font-bold text-ink/80 sm:block">
          {profile?.username ? `@${profile.username}` : name}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-lift"
        >
          <div className="flex items-center gap-3 border-b border-ink/10 bg-moss-500/5 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-moss-500/15 font-display text-lg font-bold text-moss-600">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                initial
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{name}</p>
              {profile?.username ? (
                <p className="truncate text-xs text-ink/50" dir="ltr">
                  @{profile.username}
                </p>
              ) : (
                <p className="truncate text-xs text-ink/50" dir="ltr">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <nav className="p-1.5">
            {menuLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                role="menuitem"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink/75 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <span aria-hidden className="text-ink/40">
                  {l.icon}
                </span>
                {l.label}
              </Link>
            ))}
            <button
              onClick={logout}
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10"
            >
              <span aria-hidden>⏻</span>
              {t("logout")}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
