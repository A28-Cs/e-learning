"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth, useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { SupportMessage, SupportTicket } from "@/lib/types";

// Shared conversation view for a single support ticket, used by both the
// student/teacher-facing /support/[id] page and the admin /admin/support/[id]
// page. `backHref` controls where the "back to tickets" link goes.
export default function SupportThread({
  ticketId,
  isAdminView,
  backHref,
}: {
  ticketId: string;
  isAdminView: boolean;
  backHref: string;
}) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    api<{ ticket: SupportTicket; messages: SupportMessage[] }>(`/api/support/${ticketId}`)
      .then((d) => {
        setTicket(d.ticket);
        setMessages(d.messages);
      })
      .catch(() => {});
  };
  useEffect(load, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      await api(`/api/support/${ticketId}/messages`, {
        method: "POST",
        body: { text: text.trim() },
      });
      setText("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus() {
    if (!ticket) return;
    await api(`/api/support/${ticketId}`, {
      method: "PUT",
      body: { status: ticket.status === "closed" ? "open" : "closed" },
    });
    load();
  }

  const fmt = (ms: number) =>
    new Date(ms).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    });

  if (!ticket) return <p className="py-16 text-center text-ink/50">{t("loading")}</p>;

  return (
    <div className="rise">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={backHref} className="btn-ghost !px-3 !py-1.5 text-sm">
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold">{ticket.subject}</h1>
            {isAdminView && (
              <p className="truncate text-xs text-ink/50">
                {ticket.name || ticket.email} · {ticket.email}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`chip text-xs ${
              ticket.status === "open"
                ? "bg-moss-500/15 text-moss-600"
                : "bg-ink/5 text-ink/50"
            }`}
          >
            {ticket.status === "open" ? t("statusOpen") : t("statusClosed")}
          </span>
          {isAdminView && (
            <button onClick={toggleStatus} className="btn-ghost !px-3 !py-1.5 text-xs">
              {ticket.status === "closed" ? t("reopenTicket") : t("closeTicket")}
            </button>
          )}
        </div>
      </div>

      <div className="card flex max-h-[60vh] flex-col gap-3 overflow-y-auto p-5">
        {messages.map((m) => {
          const mine = m.senderUid === user?.uid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine
                    ? "bg-moss-500 text-white"
                    : m.isAdmin
                      ? "bg-amber-500/15 text-ink"
                      : "bg-ink/5 text-ink"
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-xs font-bold opacity-70">
                    {m.senderName}
                    {m.isAdmin && ` · ${t("navAdmin")}`}
                  </p>
                )}
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-ink/40"}`} dir="ltr">
                  {fmt(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!isAdminView && ticket.status === "closed" && (
        <p className="mt-3 text-xs text-ink/50">{t("ticketClosedNote")}</p>
      )}

      <form onSubmit={send} className="mt-4 flex items-end gap-2">
        <textarea
          className="input min-h-16 flex-1"
          placeholder={t("typeMessage")}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn-primary" disabled={busy || !text.trim()}>
          {busy ? t("loading") : t("send")}
        </button>
      </form>
    </div>
  );
}
