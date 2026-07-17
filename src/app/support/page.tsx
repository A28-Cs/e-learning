"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { SupportTicket } from "@/lib/types";

export default function SupportListPage() {
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  const load = () => {
    api<SupportTicket[]>("/api/support").then(setTickets).catch(() => setTickets([]));
  };
  useEffect(() => {
    if (user) load();
  }, [user]);

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setBusy(true);
    try {
      const t = await api<SupportTicket>("/api/support", {
        method: "POST",
        body: { subject: subject.trim(), message: message.trim() },
      });
      router.push(`/support/${t.id}`);
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || !user) return <p className="py-24 text-center text-ink/50">{t("loading")}</p>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t("supportTitle")}</h1>
        <button onClick={() => setShowNew((s) => !s)} className="btn-primary">
          {showNew ? t("cancel") : `+ ${t("newTicket")}`}
        </button>
      </div>

      {showNew && (
        <form onSubmit={create} className="card mb-6 space-y-4 p-6">
          <div>
            <label className="label">{t("ticketSubject")}</label>
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">{t("ticketMessage")}</label>
            <textarea
              className="input min-h-28"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" disabled={busy}>
            {busy ? t("loading") : t("sendTicket")}
          </button>
        </form>
      )}

      {tickets === null ? (
        <p className="py-12 text-center text-ink/50">{t("loading")}</p>
      ) : tickets.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noTickets")}</p>
      ) : (
        <ul className="space-y-2">
          {tickets.map((tk) => (
            <li key={tk.id}>
              <Link
                href={`/support/${tk.id}`}
                className="card flex items-center gap-3 px-5 py-4 transition-all hover:border-moss-500/40 hover:shadow-lift"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{tk.subject}</p>
                  <p className="text-xs text-ink/50" dir="ltr">
                    {new Date(tk.lastMessageAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
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
