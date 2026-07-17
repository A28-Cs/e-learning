"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth, useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { Exam, ExamAnswer, ExamSubmission } from "@/lib/types";

type State = "loading" | "denied" | "take" | "done";

export default function TakeExamPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLang();
  const { loading: authLoading } = useAuth();
  const [state, setState] = useState<State>("loading");
  const [exam, setExam] = useState<Exam | null>(null);
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [answers, setAnswers] = useState<Record<string, ExamAnswer>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        // If already submitted, show the result instead of the form.
        const existing = await api<ExamSubmission | null>(`/api/exams/${id}/submit`);
        if (existing) {
          setSubmission(existing);
          setState("done");
          return;
        }
        const e = await api<Exam>(`/api/exams/${id}`);
        setExam(e);
        setState("take");
      } catch {
        setState("denied");
      }
    })();
  }, [authLoading, id]);

  function setAnswer(questionId: string, patch: Partial<ExamAnswer>) {
    setAnswers((a) => ({ ...a, [questionId]: { ...a[questionId], questionId, ...patch } }));
  }

  async function submit() {
    if (!exam) return;
    if (!confirm(t("confirmSubmitExam"))) return;
    setBusy(true);
    try {
      const payload = exam.questions.map(
        (q) => answers[q.id] ?? { questionId: q.id, selectedIndex: null, text: "" }
      );
      await api(`/api/exams/${id}/submit`, { method: "POST", body: { answers: payload } });
      const result = await api<ExamSubmission | null>(`/api/exams/${id}/submit`);
      setSubmission(result);
      setState("done");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return <p className="py-24 text-center text-ink/50">{t("loading")}</p>;

  if (state === "denied") {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-bold">🔒</p>
        <p className="mt-2 text-ink/60">{t("notEntitled")}</p>
      </div>
    );
  }

  if (state === "done" && submission) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="card rise p-8 text-center">
          <p className="text-4xl">🎉</p>
          <h1 className="mt-3 text-2xl font-extrabold">{submission.examTitle}</h1>
          <p className="mt-1 text-ink/60">{t("examSubmitted")}</p>
          <p className="mt-6 font-display text-5xl font-extrabold text-moss-600">
            {submission.graded ? submission.totalScore : submission.autoScore}
            <span className="text-2xl text-ink/40">/{submission.maxScore}</span>
          </p>
          <p className="mt-2 text-sm font-semibold text-ink/50">
            {submission.graded ? t("finalScore") : t("autoScore")}
          </p>
          {!submission.graded && (
            <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
              {t("essayPendingNote")}
            </p>
          )}
          {submission.teacherNote && (
            <p className="mt-4 text-sm text-ink/70">
              <span className="font-semibold">{t("teacherNote")}:</span> {submission.teacherNote}
            </p>
          )}
          <Link href={`/course/${submission.courseId}`} className="btn-ghost mt-8">
            ← {t("backToCourse")}
          </Link>
        </div>
      </div>
    );
  }

  if (state === "take" && exam) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="rise">
          <h1 className="text-2xl font-extrabold">{exam.title}</h1>
          {exam.instructions && (
            <p className="mt-2 whitespace-pre-line text-ink/60">{exam.instructions}</p>
          )}

          <div className="mt-8 space-y-5">
            {exam.questions.map((q, i) => (
              <div key={q.id} className="card p-6">
                <p className="font-semibold">
                  {i + 1}. {q.text}{" "}
                  <span className="text-xs font-normal text-ink/40">({q.points})</span>
                </p>
                {q.type === "mcq" ? (
                  <div className="mt-4 space-y-2">
                    {(q.options ?? []).map((opt, oi) => (
                      <label
                        key={oi}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/10 px-4 py-2.5 text-sm hover:border-moss-500/40"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id]?.selectedIndex === oi}
                          onChange={() => setAnswer(q.id, { selectedIndex: oi })}
                          className="accent-moss-500"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    className="input mt-4 min-h-28"
                    placeholder={t("yourAnswer")}
                    value={answers[q.id]?.text ?? ""}
                    onChange={(e) => setAnswer(q.id, { text: e.target.value })}
                  />
                )}
              </div>
            ))}
            {exam.questions.length === 0 && (
              <p className="card p-10 text-center text-ink/50">{t("noItems")}</p>
            )}
          </div>

          {exam.questions.length > 0 && (
            <button
              onClick={submit}
              disabled={busy}
              className="btn-primary mt-8 w-full !py-3"
            >
              {busy ? t("loading") : t("submitExam")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
