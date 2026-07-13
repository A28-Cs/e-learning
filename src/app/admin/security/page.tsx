"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import type { Course, SecurityEvent } from "@/lib/types";

export default function AdminSecurityPage() {
  const { t, lang } = useLang();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<SecurityEvent[]>("/api/security-events?markSeen=1"),
      api<Course[]>("/api/courses?all=1"),
    ])
      .then(([e, c]) => {
        setEvents(e);
        setCourses(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const courseTitle = (id: string) => {
    const c = courses.find((x) => x.id === id);
    return c ? (lang === "ar" ? c.titleAr : c.titleEn) : id;
  };

  return (
    <div className="rise">
      <h1 className="mb-2 text-2xl font-extrabold">{t("securityEvents")}</h1>
      <p className="mb-6 text-sm text-ink/55">
        {lang === "ar"
          ? "كل محاولة تصوير رصدها المتصفح أثناء المشاهدة بتتسجل هنا باسم الطالب."
          : "Every capture attempt the browser could detect during playback is logged here with the student's identity."}
      </p>

      {loading ? (
        <p className="py-16 text-center text-ink/50">{t("loading")}</p>
      ) : events.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noItems")}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                <th className="px-5 py-3 text-start">{t("student")}</th>
                <th className="px-5 py-3 text-start">{t("status")}</th>
                <th className="px-5 py-3 text-start">{t("forCourse")}</th>
                <th className="px-5 py-3 text-start">{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/students/${e.uid}`}
                      className="text-xs font-semibold text-moss-600 hover:underline"
                      dir="ltr"
                    >
                      {e.email}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className="chip !py-0.5 bg-red-50 text-xs text-red-600">
                      {e.type === "screenshot" ? t("eventScreenshot") : t("eventRecord")}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold">{courseTitle(e.courseId)}</td>
                  <td className="px-5 py-3 text-xs text-ink/50" dir="ltr">
                    {new Date(e.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}
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
