"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { Course, RemovalRequest } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";

interface StudentLite {
  uid: string;
  name: string;
  email: string;
}

const statusKey: Record<RemovalRequest["status"], DictKey> = {
  pending: "statusPending",
  contacted_student: "statusContacted",
  approved: "statusApproved",
  rejected: "statusRejected",
};
const statusClass: Record<RemovalRequest["status"], string> = {
  pending: "bg-amber-500/15 text-amber-600",
  contacted_student: "bg-blue-500/15 text-blue-600",
  approved: "bg-moss-500/15 text-moss-600",
  rejected: "bg-red-500/15 text-red-600",
};

export default function TeacherRemovalRequestsPage() {
  const { t, lang } = useLang();
  const [courses, setCourses] = useState<Course[]>([]);
  const [requests, setRequests] = useState<RemovalRequest[]>([]);
  const [courseId, setCourseId] = useState("");
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [studentUid, setStudentUid] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = () => {
    api<RemovalRequest[]>("/api/removal-requests?mine=1").then(setRequests).catch(() => {});
  };

  useEffect(() => {
    api<Course[]>("/api/courses?mine=1").then(setCourses).catch(() => {});
    load();
  }, []);

  useEffect(() => {
    setStudentUid("");
    setStudents([]);
    if (!courseId) return;
    api<StudentLite[]>(`/api/courses/${courseId}/students`).then(setStudents).catch(() => {});
  }, [courseId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!courseId || !studentUid || !reason.trim()) return;
    setBusy(true);
    setNotice("");
    try {
      await api("/api/removal-requests", {
        method: "POST",
        body: { courseId, studentUid, reason: reason.trim() },
      });
      setReason("");
      setStudentUid("");
      setNotice(t("requestSent"));
      load();
    } finally {
      setBusy(false);
    }
  }

  const title = (r: RemovalRequest) => (lang === "ar" ? r.courseTitleAr : r.courseTitleEn);

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("teacherRemovalRequests")}</h1>

      <form onSubmit={submit} className="card mb-6 space-y-4 p-6">
        <h2 className="font-bold">{t("requestRemovalTitle")}</h2>
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
            <label className="label">{t("selectStudent")}</label>
            <select
              className="input"
              value={studentUid}
              onChange={(e) => setStudentUid(e.target.value)}
              required
              disabled={!courseId || students.length === 0}
            >
              <option value="">{t("selectStudent")}</option>
              {students.map((s) => (
                <option key={s.uid} value={s.uid}>
                  {s.name ? `${s.name} — ${s.email}` : s.email}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">{t("removalReason")}</label>
          <textarea
            className="input min-h-20"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
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
                <th className="px-5 py-3 text-start">{t("reason")}</th>
                <th className="px-5 py-3 text-start">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-3 font-semibold">{title(r)}</td>
                  <td className="px-5 py-3 text-xs text-ink/60" dir="ltr">
                    {r.studentEmail}
                  </td>
                  <td className="max-w-xs px-5 py-3 text-xs text-ink/60">
                    <span className="line-clamp-2">{r.reason}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`chip text-xs ${statusClass[r.status]}`}>
                      {t(statusKey[r.status])}
                    </span>
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
