"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import type { DictKey } from "@/lib/i18n";

type Role = "admin" | "teacher" | "student";

interface StudentRow {
  uid: string;
  name: string;
  username: string | null;
  email: string;
  role: Role;
  teacherRequest: string | null;
  enrolledCount: number;
  createdAt: number;
}

type Filter = Role | "all" | "pending";
const ROLE_FILTERS: Filter[] = ["all", "pending", "admin", "teacher", "student"];
const roleLabelKey: Record<Role, DictKey> = {
  admin: "roleAdmin",
  teacher: "roleTeacher",
  student: "roleStudent",
};

export default function AdminStudentsPage() {
  const { t, lang } = useLang();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = () => {
    api<StudentRow[]>("/api/admin/students")
      .then(setStudents)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function decide(uid: string, action: "approveTeacher" | "rejectTeacher") {
    setBusy(uid);
    try {
      await api(`/api/admin/students/${uid}`, { method: "PUT", body: { action } });
      load();
    } finally {
      setBusy("");
    }
  }

  const q = query.trim().toLowerCase();
  const visible = students.filter((s) => {
    if (roleFilter === "pending") {
      if (s.teacherRequest !== "pending") return false;
    } else if (roleFilter !== "all" && s.role !== roleFilter) {
      return false;
    }
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.username ?? "").toLowerCase().includes(q)
    );
  });

  const pendingCount = students.filter((s) => s.teacherRequest === "pending").length;

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("adminStudents")}</h1>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-md"
          placeholder={t("searchStudents")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex gap-1.5">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`chip ${
                roleFilter === r
                  ? "bg-moss-500/10 text-moss-600"
                  : "border border-ink/15 text-ink/70"
              }`}
            >
              {r === "all"
                ? t("roleAll")
                : r === "pending"
                  ? `${t("rolePending")}${pendingCount ? ` (${pendingCount})` : ""}`
                  : t(roleLabelKey[r])}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-ink/50">{t("loading")}</p>
      ) : visible.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noItems")}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                <th className="px-5 py-3 text-start">{t("name")}</th>
                <th className="px-5 py-3 text-start">{t("email")}</th>
                <th className="px-5 py-3 text-start">{t("role")}</th>
                <th className="px-5 py-3 text-start">{t("enrollments")}</th>
                <th className="px-5 py-3 text-start">{t("joinedAt")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr key={s.uid} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-3 font-semibold">
                    {s.username ? (
                      <a
                        href={`/u/${s.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-moss-600"
                      >
                        {s.name || "—"}
                        <span className="block text-xs font-normal text-ink/40" dir="ltr">
                          @{s.username}
                        </span>
                      </a>
                    ) : (
                      s.name || "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-ink/60" dir="ltr">
                    {s.email}
                  </td>
                  <td className="px-5 py-3">
                    <span className="chip border border-ink/15 text-xs">
                      {t(roleLabelKey[s.role])}
                    </span>
                    {s.teacherRequest === "pending" && (
                      <span className="chip ms-1.5 bg-amber-500/15 text-xs text-amber-600">
                        {t("pendingTeacher")}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 tabular-nums">{s.enrolledCount}</td>
                  <td className="px-5 py-3 text-xs text-ink/50" dir="ltr">
                    {s.createdAt
                      ? new Date(s.createdAt).toLocaleDateString(
                          lang === "ar" ? "ar-EG" : "en-GB"
                        )
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {s.teacherRequest === "pending" && (
                        <>
                          <button
                            onClick={() => decide(s.uid, "approveTeacher")}
                            disabled={busy === s.uid}
                            className="btn-primary !px-3 !py-1.5 text-xs"
                          >
                            {t("approveTeacher")}
                          </button>
                          <button
                            onClick={() => decide(s.uid, "rejectTeacher")}
                            disabled={busy === s.uid}
                            className="btn-danger !px-3 !py-1.5 text-xs"
                          >
                            {t("rejectTeacher")}
                          </button>
                        </>
                      )}
                      <Link
                        href={`/admin/students/${s.uid}`}
                        className="btn-ghost !px-4 !py-1.5 text-xs"
                      >
                        {t("studentProfile")}
                      </Link>
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
