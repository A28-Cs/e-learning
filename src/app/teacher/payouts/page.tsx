"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { TeacherPayout } from "@/lib/types";

export default function TeacherPayoutsPage() {
  const { t, lang } = useLang();
  const [payouts, setPayouts] = useState<TeacherPayout[] | null>(null);

  useEffect(() => {
    api<TeacherPayout[]>("/api/payouts").then(setPayouts).catch(() => setPayouts([]));
  }, []);

  const owed = (payouts ?? []).filter((p) => p.status === "owed").reduce((s, p) => s + p.amount, 0);
  const paid = (payouts ?? []).filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const fmtDate = (ms: number) =>
    new Date(ms).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB");

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("teacherPayouts")}</h1>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="card p-5">
          <p className="font-display text-3xl font-extrabold text-amber-600">
            {owed.toLocaleString()}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink/55">{t("totalOwed")}</p>
        </div>
        <div className="card p-5">
          <p className="font-display text-3xl font-extrabold text-moss-600">
            {paid.toLocaleString()}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink/55">{t("totalPaid")}</p>
        </div>
      </div>

      {payouts === null ? (
        <p className="py-12 text-center text-ink/50">{t("loading")}</p>
      ) : payouts.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noPayouts")}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                <th className="px-5 py-3 text-start">{t("amount")}</th>
                <th className="px-5 py-3 text-start">{t("note")}</th>
                <th className="px-5 py-3 text-start">{t("status")}</th>
                <th className="px-5 py-3 text-start">{t("joinedAt")}</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id} className="border-b border-ink/5 last:border-0">
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
                    {fmtDate(p.status === "paid" && p.paidAt ? p.paidAt : p.createdAt)}
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
