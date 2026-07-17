"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { Exam, ExamSubmission } from "@/lib/types";

export default function ExamSubmissionsPage() {
  const { examId } = useParams<{ examId: string }>();
  const { t, lang } = useLang();
  const [exam, setExam] = useState<Exam | null>(null);
  const [subs, setSubs] = useState<ExamSubmission[] | null>(null);
  const [open, setOpen] = useState<string>("");

  const load = () => {
    api<ExamSubmission[]>(`/api/exams/${examId}/submissions`).then(setSubs).catch(() => setSubs([]));
  };
  useEffect(() => {
    api<Exam>(`/api/exams/${examId}`).then(setExam).catch(() => {});
    load();
  }, [examId]);

  const questionById = useMemo(
    () => new Map((exam?.questions ?? []).map((q) => [q.id, q])),
    [exam]
  );

  return (
    <div className="rise">
      <div className="mb-6 flex items-center gap-3">
        {exam && (
          <Link
            href={`/teacher/courses/${exam.courseId}/exams`}
            className="btn-ghost !px-3 !py-1.5 text-sm"
          >
            ←
          </Link>
        )}
        <h1 className="text-2xl font-extrabold">{t("viewSubmissions")}</h1>
      </div>

      {subs === null ? (
        <p className="py-12 text-center text-ink/50">{t("loading")}</p>
      ) : subs.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noSubmissions")}</p>
      ) : (
        <ul className="space-y-3">
          {subs.map((s) => (
            <li key={s.id} className="card overflow-hidden">
              <button
                onClick={() => setOpen((o) => (o === s.id ? "" : s.id))}
                className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-start"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{s.studentName || s.studentEmail}</p>
                  <p className="text-xs text-ink/50" dir="ltr">
                    {s.studentEmail}
                  </p>
                </div>
                <span className="font-display text-lg font-bold text-moss-600 tabular-nums">
                  {s.totalScore}/{s.maxScore}
                </span>
                <span
                  className={`chip text-xs ${
                    s.graded ? "bg-moss-500/15 text-moss-600" : "bg-amber-500/15 text-amber-600"
                  }`}
                >
                  {s.graded ? t("gradedBadge") : t("awaitingGrade")}
                </span>
              </button>

              {open === s.id && exam && (
                <GradePanel
                  submission={s}
                  questionById={questionById}
                  onGraded={() => {
                    setOpen("");
                    load();
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GradePanel({
  submission,
  questionById,
  onGraded,
}: {
  submission: ExamSubmission;
  questionById: Map<string, Exam["questions"][number]>;
  onGraded: () => void;
}) {
  const { t } = useLang();
  const [grades, setGrades] = useState<Record<string, number>>(() => {
    const g: Record<string, number> = {};
    for (const a of submission.answers) {
      const q = questionById.get(a.questionId);
      if (q?.type === "essay") g[a.questionId] = a.awardedPoints ?? 0;
    }
    return g;
  });
  const [note, setNote] = useState(submission.teacherNote ?? "");
  const [saving, setSaving] = useState(false);

  const hasEssay = submission.answers.some(
    (a) => questionById.get(a.questionId)?.type === "essay"
  );

  async function save() {
    setSaving(true);
    try {
      await api(`/api/submissions/${submission.id}`, {
        method: "PUT",
        body: { grades, note },
      });
      onGraded();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 border-t border-ink/10 bg-paper/40 p-5">
      {submission.answers.map((a, i) => {
        const q = questionById.get(a.questionId);
        if (!q) return null;
        const isCorrect =
          q.type === "mcq" && typeof a.selectedIndex === "number" && (a.awardedPoints ?? 0) > 0;
        return (
          <div key={a.questionId} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="mb-1 text-sm font-semibold">
              {i + 1}. {q.text}{" "}
              <span className="text-xs font-normal text-ink/40">({q.points})</span>
            </p>
            {q.type === "mcq" ? (
              <p className={`text-sm ${isCorrect ? "text-moss-600" : "text-red-600"}`}>
                {t("yourAnswer")}:{" "}
                {typeof a.selectedIndex === "number" && q.options
                  ? q.options[a.selectedIndex] ?? "—"
                  : "—"}{" "}
                {isCorrect ? "✓" : "✕"}
              </p>
            ) : (
              <div>
                <p className="whitespace-pre-wrap rounded-lg bg-ink/5 p-3 text-sm text-ink/80">
                  {a.text || "—"}
                </p>
                <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink/60">
                  {t("points")}
                  <input
                    type="number"
                    min={0}
                    max={q.points}
                    dir="ltr"
                    className="input !w-20 !py-1 text-xs"
                    value={grades[a.questionId] ?? 0}
                    onChange={(e) =>
                      setGrades((g) => ({ ...g, [a.questionId]: Number(e.target.value) }))
                    }
                  />
                  / {q.points}
                </label>
              </div>
            )}
          </div>
        );
      })}

      <div>
        <label className="label">{t("teacherNote")}</label>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <button onClick={save} disabled={saving} className="btn-primary">
        {saving ? t("loading") : hasEssay ? t("saveGrade") : t("save")}
      </button>
    </div>
  );
}
