"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import type { ActivationCode, Course } from "@/lib/types";

export default function AdminCodesPage() {
  const { t, lang } = useLang();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [count, setCount] = useState(5);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");

  useEffect(() => {
    api<Course[]>("/api/courses?all=1").then(setCourses).catch(() => {});
  }, []);

  const loadCodes = useCallback((cid: string) => {
    if (!cid) {
      setCodes([]);
      return;
    }
    api<ActivationCode[]>(`/api/codes?courseId=${cid}`).then(setCodes).catch(() => {});
  }, []);

  useEffect(() => loadCodes(courseId), [courseId, loadCodes]);

  async function generate(e: FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setBusy(true);
    try {
      await api("/api/codes", { method: "POST", body: { courseId, count } });
      loadCodes(courseId);
    } finally {
      setBusy(false);
    }
  }

  function copy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 1500);
  }

  const courseTitle = (c: Course) => (lang === "ar" ? c.titleAr : c.titleEn);

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("adminCodes")}</h1>

      <form onSubmit={generate} className="card mb-6 grid gap-4 p-6 sm:grid-cols-[1fr_140px_auto]">
        <div>
          <label className="label">{t("forCourse")}</label>
          <select
            className="input"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
          >
            <option value="">{t("selectCourse")}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {courseTitle(c)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t("codesCount")}</label>
          <input
            className="input"
            type="number"
            min={1}
            max={200}
            dir="ltr"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </div>
        <div className="flex items-end">
          <button className="btn-primary" disabled={busy || !courseId}>
            {busy ? t("loading") : t("generateCodes")}
          </button>
        </div>
      </form>

      {courseId && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-start text-xs uppercase tracking-wide text-ink/50">
                <th className="px-5 py-3 text-start">{t("code")}</th>
                <th className="px-5 py-3 text-start">{t("status")}</th>
                <th className="px-5 py-3 text-start">{t("usedBy")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-3 font-mono font-bold tracking-wider" dir="ltr">
                    {c.code}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`chip !py-0.5 text-xs ${
                        c.used
                          ? "bg-ink/5 text-ink/45"
                          : "bg-moss-500/10 text-moss-600"
                      }`}
                    >
                      {c.used ? t("used") : t("available")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink/55" dir="ltr">
                    {c.usedByEmail ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-end">
                    {!c.used && (
                      <button
                        onClick={() => copy(c.code)}
                        className="btn-ghost !px-3 !py-1 text-xs"
                      >
                        {copiedCode === c.code ? t("copied") : t("copy")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {codes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-ink/50">
                    {t("noItems")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
