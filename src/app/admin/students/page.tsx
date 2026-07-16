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
  email: string;
  role: Role;
  enrolledCount: number;
  createdAt: number;
}

const ROLE_FILTERS: (Role | "all")[] = ["all", "admin", "teacher", "student"];
const roleLabelKey: Record<Role, DictKey> = {
  admin: "roleAdmin",
  teacher: "roleTeacher",
  student: "roleStudent",
};

export default function AdminStudentsPage() {
  const { t, lang } = useLang();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<StudentRow[]>("/api/admin/students")
      .then(setStudents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const visible = students.filter((s) => {
    if (roleFilter !== "all" && s.role !== roleFilter) return false;
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

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
              {r === "all" ? t("roleAll") : t(roleLabelKey[r])}
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
                  <td className="px-5 py-3 font-semibold">{s.name || "—"}</td>
                  <td className="px-5 py-3 text-xs text-ink/60" dir="ltr">
                    {s.email}
                  </td>
                  <td className="px-5 py-3">
                    <span className="chip border border-ink/15 text-xs">
                      {t(roleLabelKey[s.role])}
                    </span>
                  </td>
                  <td className="px-5 py-3 tabular-nums">{s.enrolledCount}</td>
                  <td className="px-5 py-3 text-xs text-ink/50" dir="ltr">
                    {s.createdAt
                      ? new Date(s.createdAt).toLocaleDateString(
                          lang === "ar" ? "ar-EG" : "en-GB"
                        )
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-end">
                    <Link
                      href={`/admin/students/${s.uid}`}
                      className="btn-ghost !px-4 !py-1.5 text-xs"
                    >
                      {t("studentProfile")}
                    </Link>
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
