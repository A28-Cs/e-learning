"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import type { DictKey } from "@/lib/i18n";

type Role = "admin" | "teacher" | "student";
const roleLabelKey: Record<Role, DictKey> = {
  admin: "roleAdmin",
  teacher: "roleTeacher",
  student: "roleStudent",
};

interface Profile {
  student: { uid: string; name: string; email: string; role: Role; createdAt: number };
  enrollments: { courseId: string; titleAr: string; titleEn: string }[];
  allCourses: { id: string; titleAr: string; titleEn: string }[];
  paymentRequests: {
    id: string;
    courseTitleAr: string;
    courseTitleEn: string;
    amount: number;
    method: string;
    status: string;
    receiptUrl: string;
    createdAt: number;
  }[];
  codes: { code: string; courseId: string; usedAt: number | null }[];
  orders: {
    id: string;
    courseTitleAr: string;
    courseTitleEn: string;
    amountCents: number;
    status: string;
    createdAt: number;
  }[];
}

export default function StudentProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { t, lang } = useLang();
  const [data, setData] = useState<Profile | null>(null);
  const [grantId, setGrantId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<Profile>(`/api/admin/students/${uid}`)
      .then(setData)
      .catch(() => setData(null));
  }, [uid]);

  useEffect(load, [load]);

  async function change(action: "grant" | "revoke", courseId: string) {
    setBusy(true);
    try {
      await api(`/api/admin/students/${uid}`, { method: "PUT", body: { action, courseId } });
      setGrantId("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function setRole(role: Role) {
    setBusy(true);
    try {
      await api(`/api/admin/students/${uid}`, { method: "PUT", body: { action: "setRole", role } });
      load();
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="py-16 text-center text-ink/50">{t("loading")}</p>;

  const { student, enrollments, allCourses, paymentRequests, codes, orders } = data;
  const titleOf = (ar: string, en: string) => (lang === "ar" ? ar : en);
  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB");
  const notEnrolled = allCourses.filter(
    (c) => !enrollments.some((e) => e.courseId === c.id)
  );
  const courseTitleById = (id: string) => {
    const c = allCourses.find((x) => x.id === id);
    return c ? titleOf(c.titleAr, c.titleEn) : id;
  };

  return (
    <div className="rise space-y-6">
      <Link href="/admin/students" className="text-sm font-semibold text-moss-600 hover:underline">
        ← {t("adminStudents")}
      </Link>

      {/* Info */}
      <div className="card flex flex-wrap items-center gap-5 p-6">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-moss-500 font-display text-xl font-bold text-white">
          {(student.name || student.email).charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold">{student.name || "—"}</h1>
          <p className="text-sm text-ink/60" dir="ltr">
            {student.email}
          </p>
        </div>
        <div className="min-w-40">
          <label className="label">{t("changeRole")}</label>
          <select
            className="input"
            value={student.role}
            disabled={busy}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {(["admin", "teacher", "student"] as Role[]).map((r) => (
              <option key={r} value={r}>
                {t(roleLabelKey[r])}
              </option>
            ))}
          </select>
        </div>
        <div className="ms-auto text-end text-xs text-ink/50">
          <p>{t("joinedAt")}</p>
          <p className="mt-0.5 font-semibold" dir="ltr">
            {student.createdAt ? fmtDate(student.createdAt) : "—"}
          </p>
        </div>
      </div>

      {/* Enrollments */}
      <section className="card p-6">
        <h2 className="mb-4 font-bold">
          {t("enrollments")} ({enrollments.length})
        </h2>
        {enrollments.length === 0 ? (
          <p className="text-sm text-ink/50">{t("noItems")}</p>
        ) : (
          <ul className="space-y-2">
            {enrollments.map((e) => (
              <li
                key={e.courseId}
                className="flex items-center justify-between rounded-xl bg-moss-500/5 px-4 py-3"
              >
                <span className="font-semibold">{titleOf(e.titleAr, e.titleEn)}</span>
                <button
                  onClick={() => change("revoke", e.courseId)}
                  disabled={busy}
                  className="btn-danger !px-3 !py-1.5 text-xs"
                >
                  {t("revoke")}
                </button>
              </li>
            ))}
          </ul>
        )}

        {notEnrolled.length > 0 && (
          <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-ink/10 pt-5">
            <div className="min-w-56 flex-1">
              <label className="label">{t("grantCourse")}</label>
              <select
                className="input"
                value={grantId}
                onChange={(e) => setGrantId(e.target.value)}
              >
                <option value="">—</option>
                {notEnrolled.map((c) => (
                  <option key={c.id} value={c.id}>
                    {titleOf(c.titleAr, c.titleEn)}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => grantId && change("grant", grantId)}
              disabled={busy || !grantId}
              className="btn-primary"
            >
              + {t("grant")}
            </button>
          </div>
        )}
      </section>

      {/* Transactions */}
      <section className="card p-6">
        <h2 className="mb-4 font-bold">{t("transactions")}</h2>
        {paymentRequests.length + codes.length + orders.length === 0 ? (
          <p className="text-sm text-ink/50">{t("noItems")}</p>
        ) : (
          <div className="space-y-2 text-sm">
            {paymentRequests.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-ink/[.03] px-4 py-3">
                <span className="chip !py-0.5 bg-amber-500/15 text-xs text-amber-600">
                  {t("viaManual")}
                </span>
                <span className="font-semibold">
                  {titleOf(r.courseTitleAr, r.courseTitleEn)}
                </span>
                <span className="tabular-nums" dir="ltr">
                  {r.amount.toLocaleString()} {t("egp")}
                </span>
                <span
                  className={`chip !py-0.5 text-xs ${
                    r.status === "approved"
                      ? "bg-moss-500/10 text-moss-600"
                      : r.status === "pending"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {r.status === "approved"
                    ? t("paid")
                    : r.status === "pending"
                      ? t("pendingOrder")
                      : t("failedOrder")}
                </span>
                {r.receiptUrl && (
                  <a
                    href={r.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-moss-600 hover:underline"
                  >
                    {t("receipt")} ↗
                  </a>
                )}
                <span className="ms-auto text-xs text-ink/45" dir="ltr">
                  {fmtDate(r.createdAt)}
                </span>
              </div>
            ))}
            {codes.map((c) => (
              <div key={c.code} className="flex flex-wrap items-center gap-3 rounded-xl bg-ink/[.03] px-4 py-3">
                <span className="chip !py-0.5 bg-moss-500/10 text-xs text-moss-600">
                  {t("viaCode")}
                </span>
                <span className="font-semibold">{courseTitleById(c.courseId)}</span>
                <span className="font-mono text-xs tracking-wider text-ink/60" dir="ltr">
                  {c.code}
                </span>
                <span className="ms-auto text-xs text-ink/45" dir="ltr">
                  {c.usedAt ? fmtDate(c.usedAt) : ""}
                </span>
              </div>
            ))}
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-ink/[.03] px-4 py-3">
                <span className="chip !py-0.5 bg-ink/10 text-xs text-ink/60">Paymob</span>
                <span className="font-semibold">
                  {titleOf(o.courseTitleAr, o.courseTitleEn)}
                </span>
                <span className="tabular-nums" dir="ltr">
                  {(o.amountCents / 100).toLocaleString()} {t("egp")}
                </span>
                <span
                  className={`chip !py-0.5 text-xs ${
                    o.status === "paid"
                      ? "bg-moss-500/10 text-moss-600"
                      : "bg-amber-500/15 text-amber-600"
                  }`}
                >
                  {o.status === "paid" ? t("paid") : t("pendingOrder")}
                </span>
                <span className="ms-auto text-xs text-ink/45" dir="ltr">
                  {fmtDate(o.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
