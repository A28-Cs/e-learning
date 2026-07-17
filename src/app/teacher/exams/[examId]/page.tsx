"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { Exam, ExamQuestion, QuestionType } from "@/lib/types";

function newQuestion(type: QuestionType): ExamQuestion {
  const base: ExamQuestion = {
    id: Math.random().toString(36).slice(2, 10),
    type,
    text: "",
    points: 1,
  };
  if (type === "mcq") {
    base.options = ["", ""];
    base.correctIndex = 0;
  }
  return base;
}

export default function ExamBuilderPage() {
  const { examId } = useParams<{ examId: string }>();
  const { t } = useLang();
  const [exam, setExam] = useState<Exam | null>(null);
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api<Exam>(`/api/exams/${examId}`).then((e) => {
      setExam(e);
      setTitle(e.title);
      setInstructions(e.instructions);
      setQuestions(e.questions);
    });
  }, [examId]);

  function patchQuestion(i: number, patch: Partial<ExamQuestion>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function setOption(qi: number, oi: number, value: string) {
    setQuestions((qs) =>
      qs.map((q, idx) =>
        idx === qi ? { ...q, options: q.options!.map((o, j) => (j === oi ? value : o)) } : q
      )
    );
  }

  async function save(publishState?: boolean) {
    setSaving(true);
    setNotice("");
    try {
      await api(`/api/exams/${examId}`, {
        method: "PUT",
        body: {
          title,
          instructions,
          questions,
          ...(publishState !== undefined ? { published: publishState } : {}),
        },
      });
      if (publishState !== undefined) {
        setExam((e) => (e ? { ...e, published: publishState } : e));
      }
      setNotice(t("examSubmitted"));
    } finally {
      setSaving(false);
    }
  }

  if (!exam) return <p className="py-16 text-center text-ink/50">{t("loading")}</p>;

  return (
    <div className="rise max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/teacher/courses/${exam.courseId}/exams`}
          className="btn-ghost !px-3 !py-1.5 text-sm"
        >
          ←
        </Link>
        <h1 className="text-2xl font-extrabold">{t("edit")}</h1>
        <span
          className={`chip text-xs ${
            exam.published ? "bg-moss-500/15 text-moss-600" : "bg-ink/5 text-ink/50"
          }`}
        >
          {exam.published ? t("publishedBadge") : t("draftBadge")}
        </span>
      </div>

      <div className="card mb-6 space-y-4 p-6">
        <div>
          <label className="label">{t("examTitle")}</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">{t("examInstructions")}</label>
          <textarea
            className="input min-h-20"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="card space-y-3 p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-moss-500/10 text-sm font-bold text-moss-600">
                {i + 1}
              </span>
              <span className="chip bg-ink/5 text-xs text-ink/60">
                {q.type === "mcq" ? t("typeMcq") : t("typeEssay")}
              </span>
              <div className="flex-1" />
              <label className="flex items-center gap-1.5 text-xs text-ink/60">
                {t("points")}
                <input
                  type="number"
                  min={0}
                  dir="ltr"
                  className="input !w-16 !py-1 text-xs"
                  value={q.points}
                  onChange={(e) => patchQuestion(i, { points: Number(e.target.value) })}
                />
              </label>
              <button
                onClick={() => setQuestions((qs) => qs.filter((_, idx) => idx !== i))}
                className="btn-danger !px-2.5 !py-1 text-xs"
              >
                {t("delete")}
              </button>
            </div>

            <textarea
              className="input min-h-16"
              placeholder={t("questionText")}
              value={q.text}
              onChange={(e) => patchQuestion(i, { text: e.target.value })}
            />

            {q.type === "mcq" && (
              <div className="space-y-2">
                {q.options!.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctIndex === oi}
                      onChange={() => patchQuestion(i, { correctIndex: oi })}
                      className="accent-moss-500"
                      title={t("correctAnswer")}
                    />
                    <input
                      className="input flex-1 !py-1.5 text-sm"
                      placeholder={`${t("option")} ${oi + 1}`}
                      value={opt}
                      onChange={(e) => setOption(i, oi, e.target.value)}
                    />
                    {q.options!.length > 2 && (
                      <button
                        onClick={() =>
                          patchQuestion(i, {
                            options: q.options!.filter((_, j) => j !== oi),
                            correctIndex:
                              q.correctIndex === oi ? 0 : Math.max(0, (q.correctIndex ?? 0) - (oi < (q.correctIndex ?? 0) ? 1 : 0)),
                          })
                        }
                        className="text-ink/40 hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </label>
                ))}
                <button
                  onClick={() => patchQuestion(i, { options: [...q.options!, ""] })}
                  className="text-xs font-semibold text-moss-600 hover:underline"
                >
                  {t("addOption")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => setQuestions((qs) => [...qs, newQuestion("mcq")])} className="btn-ghost">
          + {t("typeMcq")}
        </button>
        <button onClick={() => setQuestions((qs) => [...qs, newQuestion("essay")])} className="btn-ghost">
          + {t("typeEssay")}
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
        <button onClick={() => save()} disabled={saving} className="btn-primary">
          {saving ? t("loading") : t("save")}
        </button>
        <button
          onClick={() => save(!exam.published)}
          disabled={saving}
          className="btn-amber"
        >
          {exam.published ? t("unpublishExam") : t("publishExam")}
        </button>
        {notice && <span className="text-sm font-medium text-moss-600">{notice}</span>}
      </div>
    </div>
  );
}
