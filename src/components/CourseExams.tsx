"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import type { Exam } from "@/lib/types";

// Shown on the course page to enrolled students: the published exams they can take.
export default function CourseExams({ courseId }: { courseId: string }) {
  const { t } = useLang();
  const [exams, setExams] = useState<Exam[] | null>(null);

  useEffect(() => {
    api<Exam[]>(`/api/exams?courseId=${courseId}`)
      .then(setExams)
      .catch(() => setExams([]));
  }, [courseId]);

  if (!exams || exams.length === 0) return null;

  return (
    <>
      <h2 className="mt-12 text-xl font-bold">{t("exams")}</h2>
      <ul className="mt-4 space-y-2">
        {exams.map((e) => (
          <li key={e.id}>
            <Link
              href={`/exam/${e.id}`}
              className="card flex items-center gap-4 px-5 py-4 transition-all hover:border-moss-500/40 hover:shadow-lift"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-base">
                📝
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.title}</p>
                <p className="text-xs text-ink/50">
                  {e.questions.length} {t("questionsCount")}
                </p>
              </div>
              <span className="text-xs font-semibold text-moss-600">{t("takeExam")} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
