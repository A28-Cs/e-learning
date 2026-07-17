"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useLang } from "@/context/AppProviders";
import AdminNotifications from "@/components/AdminNotifications";
import AccountMenu from "@/components/AccountMenu";

export default function Navbar() {
  const { t, lang, setLang } = useLang();
  const { user, profile } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("navHome") },
    ...(user ? [{ href: "/my-courses", label: t("navMyCourses") }] : []),
    ...(profile?.role === "teacher" ? [{ href: "/teacher", label: t("navTeacher") }] : []),
    ...(profile?.isAdmin ? [{ href: "/admin", label: t("navAdmin") }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-moss-500 font-display text-lg font-bold text-white">
            ت
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            {t("brand")}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`chip ${
                pathname === l.href
                  ? "bg-moss-500/10 text-moss-600"
                  : "text-ink/70 hover:bg-ink/5 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {profile?.isAdmin && <AdminNotifications />}
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="chip border border-ink/15 text-xs font-bold hover:border-moss-500 hover:text-moss-600"
            title="Language"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          {user ? (
            <AccountMenu />
          ) : (
            <>
              <Link href="/login" className="btn-ghost !px-4 !py-2 text-xs">
                {t("login")}
              </Link>
              <Link href="/register" className="btn-primary !px-4 !py-2 text-xs">
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
