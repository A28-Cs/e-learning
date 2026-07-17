"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { TeacherPayout } from "@/lib/types";

interface UserRow {
  uid: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
}

export default function AdminPayoutsPage() {
  const { t, lang } = useLang();
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [payouts, setPayouts] = useState<TeacherPayout[]>([]);
  const [teacherId, setTeacherId] = useState("");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");

  const load = () => {
    api<TeacherPayout[]>("/api/payouts").then(setPayouts).catch(() => {});
  };
  useEffect(() => {
    api<UserRow[]>("/api/admin/students")
      .then((rows) => setTeachers(rows.filter((r) => r.role === "teacher")))
      .catch(() => {});
    load();
  }, []);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!teacherId || !(amount > 0)) return;
    setBusy("add");
    try {
      await api("/api/payouts", { method: "POST", body: { teacherId, amount, note } });
      setAmount(0);
      setNote("");
      load();
    } finally {
      setBusy("");
    }
  }

  async function setPaid(p: TeacherPayout, paid: boolean) {
    setBusy(p.id);
    try {
      await api(`/api/payouts/${p.id}`, {
        method: "PUT",
        body: { status: paid ? "paid" : "owed" },
      });
      load();
    } finally {
      setBusy("");
    }
  }

  async function remove(p: TeacherPayout) {
    if (!confirm(t("confirmDelete"))) return;
    setBusy(p.id);
    try {
      await api(`/api/payouts/${p.id}`, { method: "DELETE" });
      load();
    } finally {
      setBusy("");
    }
  }

  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB");

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("adminPayouts")}</h1>

      <form onSubmit={add} className="card mb-6 flex flex-wrap items-end gap-3 p-6">
        <div className="min-w-48 flex-1">
          <label className="label">{t("teacherLabel")}</label>
          <select
            className="input"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            required
          >
            <option value="">—</option>
            {teachers.map((tt) => (
              <option key={tt.uid} value={tt.uid}>
                {tt.name ? `${tt.name} — ${tt.email}` : tt.email}
              </option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="label">{t("amount")}</label>
          <input
            className="input"
            type="number"
            min={0}
            dir="ltr"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </div>
        <div className="min-w-40 flex-1">
          <label className="label">{t("note")}</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn-primary" disabled={busy === "add"}>
          + {t("addPayout")}
        </button>
      </form>

      {payouts.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noPayouts")}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                <th className="px-5 py-3 text-start">{t("teacherLabel")}</th>
                <th className="px-5 py-3 text-start">{t("amount")}</th>
                <th className="px-5 py-3 text-start">{t("note")}</th>
                <th className="px-5 py-3 text-start">{t("status")}</th>
                <th className="px-5 py-3 text-start">{t("joinedAt")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-semibold">{p.teacherName || "—"}</p>
                    <p className="text-xs text-ink/50" dir="ltr">
                      {p.teacherEmail}
                    </p>
                  </td>
                  <td className="px-5 py-3 font-bold tabular-nums">
                    {p.amount.toLocaleString()} {p.currency}
                  </td>
                  <td className="px-5 py-3 text-ink/60">{p.note || "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`chip text-xs ${
                        p.status === "paid"
                          ? "bg-moss-500/15 text-moss-600"
                          : "bg-amber-500/15 text-amber-600"
                      }`}
                    >
                      {p.status === "paid" ? t("statusPaid") : t("statusOwed")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink/50" dir="ltr">
                    {fmtDate(p.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.status === "owed" ? (
                        <button
                          onClick={() => setPaid(p, true)}
                          disabled={busy === p.id}
                          className="btn-primary !px-3 !py-1.5 text-xs"
                        >
                          {t("markPaid")}
                        </button>
                      ) : (
                        <button
                          onClick={() => setPaid(p, false)}
                          disabled={busy === p.id}
                          className="btn-ghost !px-3 !py-1.5 text-xs"
                        >
                          {t("statusOwed")}
                        </button>
                      )}
                      <button
                        onClick={() => remove(p)}
                        disabled={busy === p.id}
                        className="btn-danger !px-2.5 !py-1.5 text-xs"
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
