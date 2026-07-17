"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useLang } from "@/context/AppProviders";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const { profile, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return <p className="py-24 text-center text-ink/50">{t("loading")}</p>;
  }

  if (!profile?.isAdmin) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-bold">🚫</p>
        <p className="mt-2 text-ink/60">{t("adminOnly")}</p>
        <Link href="/login" className="btn-primary mt-6">
          {t("login")}
        </Link>
      </div>
    );
  }

  const nav = [
    { href: "/admin", label: t("adminDashboard"), icon: "◫" },
    { href: "/admin/courses", label: t("adminCourses"), icon: "▤" },
    { href: "/admin/categories", label: t("adminCategories"), icon: "◈" },
    { href: "/admin/codes", label: t("adminCodes"), icon: "⌘" },
    { href: "/admin/code-requests", label: t("adminCodeRequests"), icon: "⎙" },
    { href: "/admin/removal-requests", label: t("adminRemovalRequests"), icon: "⊘" },
    { href: "/admin/students", label: t("adminStudents"), icon: "◉" },
    { href: "/admin/security", label: t("adminSecurity"), icon: "◬" },
    { href: "/admin/orders", label: t("adminOrders"), icon: "◎" },
    { href: "/admin/payment-requests", label: t("adminPaymentRequests"), icon: "🧾" },
    { href: "/admin/payouts", label: t("adminPayouts"), icon: "💵" },
    { href: "/admin/settings", label: t("adminSettings"), icon: "⚙" },
  ];

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-8">
      <aside className="hidden w-56 shrink-0 md:block">
        <nav className="sticky top-24 space-y-1 rounded-2xl bg-moss-900 p-3 text-white shadow-card">
          {nav.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
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
