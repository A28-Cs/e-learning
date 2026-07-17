"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { Exam } from "@/lib/types";

export default function TeacherCourseExamsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLang();
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    api<Exam[]>(`/api/exams?courseId=${id}`).then(setExams).catch(() => setExams([]));
  };
  useEffect(load, [id]);

  async function create() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const created = await api<Exam>("/api/exams", {
        method: "POST",
        body: { courseId: id, title: title.trim() },
      });
      setTitle("");
      // jump straight into the builder
      window.location.href = `/teacher/exams/${created.id}`;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rise">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/teacher/courses/${id}`} className="btn-ghost !px-3 !py-1.5 text-sm">
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">{t("exams")}</h1>
      </div>

      <div className="card mb-6 flex flex-wrap items-end gap-3 p-6">
        <div className="min-w-56 flex-1">
          <label className="label">{t("examTitle")}</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("newExam")}
          />
        </div>
        <button onClick={create} disabled={busy || !title.trim()} className="btn-primary">
          + {t("newExam")}
        </button>
      </div>

      {exams === null ? (
        <p className="py-12 text-center text-ink/50">{t("loading")}</p>
      ) : exams.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noExams")}</p>
      ) : (
        <ul className="space-y-2">
          {exams.map((e) => (
            <li key={e.id} className="card flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.title}</p>
                <p className="text-xs text-ink/50">
                  {e.questions.length} {t("questionsCount")}
                </p>
              </div>
              <span
                className={`chip text-xs ${
                  e.published ? "bg-moss-500/15 text-moss-600" : "bg-ink/5 text-ink/50"
                }`}
              >
                {e.published ? t("publishedBadge") : t("draftBadge")}
              </span>
              <Link
                href={`/teacher/exams/${e.id}/submissions`}
                className="btn-ghost !px-3 !py-1.5 text-xs"
              >
                {t("viewSubmissions")}
              </Link>
              <Link
                href={`/teacher/exams/${e.id}`}
                className="btn-primary !px-4 !py-1.5 text-xs"
              >
                {t("edit")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
