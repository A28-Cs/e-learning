"use client";

import Link from "next/link";
import { useLang } from "@/context/AppProviders";

export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink/10 bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-moss-500 font-display text-lg font-bold text-white">
              ت
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              {t("brand")}
            </span>
          </Link>
          <p className="mt-3 text-xs leading-relaxed text-ink/55">
            {t("footerTagline")}
          </p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-ink/70">
          <Link href="/" className="hover:text-moss-600">
            {t("navHome")}
          </Link>
          <Link href="/my-courses" className="hover:text-moss-600">
            {t("navMyCourses")}
          </Link>
          <Link href="/register" className="hover:text-moss-600">
            {t("register")}
          </Link>
        </nav>
      </div>
      <div className="border-t border-ink/5 py-4 text-center text-xs text-ink/45">
        © {year} {t("brand")} — {t("footerRights")}
      </div>
    </footer>
  );
}
