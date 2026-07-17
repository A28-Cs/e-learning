"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { SupportTicket } from "@/lib/types";

export default function AdminSupportPage() {
  const { t, lang } = useLang();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyOpen, setOnlyOpen] = useState(true);

  useEffect(() => {
    api<SupportTicket[]>("/api/support")
      .then(setTickets)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = onlyOpen ? tickets.filter((t) => t.status === "open") : tickets;
  const needsReplyCount = tickets.filter((t) => t.unreadByAdmin).length;

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("adminSupport")}</h1>

      <div className="mb-5 flex gap-1.5">
        <button
          onClick={() => setOnlyOpen(true)}
          className={`chip ${onlyOpen ? "bg-moss-500/10 text-moss-600" : "border border-ink/15 text-ink/70"}`}
        >
          {t("statusOpen")}
        </button>
        <button
          onClick={() => setOnlyOpen(false)}
          className={`chip ${!onlyOpen ? "bg-moss-500/10 text-moss-600" : "border border-ink/15 text-ink/70"}`}
        >
          {t("roleAll")}
        </button>
        {needsReplyCount > 0 && (
          <span className="chip bg-amber-500/15 text-xs text-amber-600">
            {t("needsReply")} ({needsReplyCount})
          </span>
        )}
      </div>

      {loading ? (
        <p className="py-16 text-center text-ink/50">{t("loading")}</p>
      ) : visible.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noTickets")}</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((tk) => (
            <li key={tk.id}>
              <Link
                href={`/admin/support/${tk.id}`}
                className="card flex items-center gap-3 px-5 py-4 transition-all hover:border-moss-500/40 hover:shadow-lift"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {tk.subject}
                    {tk.unreadByAdmin && (
                      <span className="ms-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />
                    )}
                  </p>
                  <p className="truncate text-xs text-ink/50" dir="ltr">
                    {tk.name || tk.email} · {tk.email}
                  </p>
                </div>
                <span className="text-xs text-ink/40" dir="ltr">
                  {new Date(tk.lastMessageAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
                <span
                  className={`chip text-xs ${
                    tk.status === "open"
                      ? "bg-moss-500/15 text-moss-600"
                      : "bg-ink/5 text-ink/50"
                  }`}
                >
                  {tk.status === "open" ? t("statusOpen") : t("statusClosed")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
