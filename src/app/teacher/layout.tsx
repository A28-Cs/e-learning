"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useLang } from "@/context/AppProviders";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const { profile, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <p className="py-24 text-center text-ink/50">{t("loading")}</p>;
  }

  if (!(profile?.role === "teacher" || profile?.isAdmin)) {
    const pending = profile?.teacherRequest === "pending";
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-bold">{pending ? "⏳" : "🚫"}</p>
        <p className="mt-2 text-ink/60">{pending ? t("teacherPending") : t("teacherOnly")}</p>
        {!profile && (
          <Link href="/login" className="btn-primary mt-6">
            {t("login")}
          </Link>
        )}
      </div>
    );
  }

  // Teachers must have a contact phone on file (used to arrange payouts)
  // before they can use the dashboard. Admins are exempt.
  if (profile?.role === "teacher" && !profile.isAdmin && !profile.phone) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-bold">📞</p>
        <p className="mt-2 text-ink/60">{t("teacherPhoneRequiredNote")}</p>
        <Link href="/profile" className="btn-primary mt-6">
          {t("completeProfile")}
        </Link>
      </div>
    );
  }

  const nav = [
    { href: "/teacher", label: t("teacherDashboard"), icon: "◫" },
    { href: "/teacher/courses", label: t("teacherCourses"), icon: "▤" },
    { href: "/teacher/code-requests", label: t("teacherCodeRequests"), icon: "⌘" },
    { href: "/teacher/removal-requests", label: t("teacherRemovalRequests"), icon: "◉" },
    { href: "/teacher/payouts", label: t("teacherPayouts"), icon: "🧾" },
  ];

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="sticky top-24 space-y-1 rounded-2xl bg-moss-900 p-3 text-white shadow-card">
          {nav.map((item) => {
            const active =
              item.href === "/teacher"
                ? pathname === "/teacher"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-moss-500 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* mobile nav */}
        <nav className="mb-4 flex gap-2 overflow-x-auto md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`chip whitespace-nowrap ${
                pathname === item.href
                  ? "bg-moss-500 text-white"
                  : "border border-ink/15"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
