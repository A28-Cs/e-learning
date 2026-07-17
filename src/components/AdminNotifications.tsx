"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";

interface Counts {
  payments: number;
  security: number;
  codeRequests: number;
  teachers: number;
}

const POLL_MS = 45_000;

// Admin-only bell in the navbar: polls pending payment requests and unseen
// security events, badges the total, and fires a browser notification when
// either number goes up while the site is open.
export default function AdminNotifications() {
  const { t } = useLang();
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>({
    payments: 0,
    security: 0,
    codeRequests: 0,
    teachers: 0,
  });
  const prev = useRef<Counts | null>(null);

  useEffect(() => {
    let alive = true;

    const alerts: { key: keyof Counts; msg: () => string }[] = [
      { key: "payments", msg: () => t("notifPayment") },
      { key: "security", msg: () => t("notifSecurity") },
      { key: "codeRequests", msg: () => t("notifCodeRequest") },
      { key: "teachers", msg: () => t("notifTeacher") },
    ];

    async function poll() {
      try {
        const c = await api<Counts>("/api/admin/pending-count");
        if (!alive) return;
        const before = prev.current;
        if (before) {
          for (const a of alerts) if (c[a.key] > before[a.key]) notify(a.msg());
        }
        prev.current = c;
        setCounts(c);
      } catch {
        /* not fatal — retry next tick */
      }
    }

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [t]);

  function notify(message: string) {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification("Taqato Academy", { body: message, icon: "/icon.svg" });
    }
  }

  function onClick() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    router.push(destination());
  }

  function destination() {
    if (counts.security > 0) return "/admin/security";
    if (counts.codeRequests > 0) return "/admin/code-requests";
    if (counts.teachers > 0) return "/admin/students";
    return "/admin/payment-requests";
  }

  const total =
    counts.payments + counts.security + counts.codeRequests + counts.teachers;

  return (
    <button
      onClick={onClick}
      title={t("enableNotifs")}
      className="relative grid h-9 w-9 place-items-center rounded-xl border border-ink/15 text-base transition-colors hover:border-moss-500"
    >
      🔔
      {total > 0 && (
        <span className="absolute -top-1.5 -end-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {total > 99 ? "99+" : total}
        </span>
      )}
    </button>
  );
}
