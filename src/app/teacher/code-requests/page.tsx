"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { CodeRequest, Course } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";

const statusKey: Record<CodeRequest["status"], DictKey> = {
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
};
const statusClass: Record<CodeRequest["status"], string> = {
  pending: "bg-amber-500/15 text-amber-600",
  approved: "bg-moss-500/15 text-moss-600",
  rejected: "bg-red-500/15 text-red-600",
};

export default function TeacherCodeRequestsPage() {
  const { t, lang } = useLang();
  const [courses, setCourses] = useState<Course[]>([]);
  const [requests, setRequests] = useState<CodeRequest[]>([]);
  const [courseId, setCourseId] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = () => {
    api<CodeRequest[]>("/api/code-requests?mine=1").then(setRequests).catch(() => {});
  };

  useEffect(() => {
    api<Course[]>("/api/courses?mine=1").then(setCourses).catch(() => {});
    load();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!courseId || !email.trim()) return;
    setBusy(true);
    setNotice("");
    try {
      await api("/api/code-requests", {
        method: "POST",
        body: { courseId, studentEmail: email.trim() },
      });
      setEmail("");
      setNotice(t("requestSent"));
      load();
    } finally {
      setBusy(false);
    }
  }

  const title = (r: CodeRequest) => (lang === "ar" ? r.courseTitleAr : r.courseTitleEn);

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("teacherCodeRequests")}</h1>

      <form onSubmit={submit} className="card mb-6 space-y-4 p-6">
        <h2 className="font-bold">{t("requestCodeTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t("teacherCourses")}</label>
            <select
              className="input"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            >
              <option value="">{t("selectCourse")}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {lang === "ar" ? c.titleAr : c.titleEn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">{t("studentEmail")}</label>
            <input
              className="input"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={busy}>
            {busy ? t("loading") : t("submitRequest")}
          </button>
          {notice && <span className="text-sm font-medium text-moss-600">{notice}</span>}
        </div>
      </form>

      <h2 className="mb-3 font-bold">{t("myRequests")}</h2>
      {requests.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noRequests")}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                <th className="px-5 py-3 text-start">{t("teacherCourses")}</th>
                <th className="px-5 py-3 text-start">{t("studentLabel")}</th>
                <th className="px-5 py-3 text-start">{t("status")}</th>
                <th className="px-5 py-3 text-start">{t("generatedCode")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-3 font-semibold">{title(r)}</td>
                  <td className="px-5 py-3 text-xs text-ink/60" dir="ltr">
                    {r.studentEmail}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`chip text-xs ${statusClass[r.status]}`}>
                      {t(statusKey[r.status])}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {r.code ? (
                      <button
                        onClick={() => navigator.clipboard?.writeText(r.code!)}
                        className="chip border border-ink/15 font-mono text-xs"
                        title={t("codeCopied")}
                        dir="ltr"
                      >
                        {r.code}
                      </button>
                    ) : (
                      <span className="text-ink/30">—</span>
                    )}
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
