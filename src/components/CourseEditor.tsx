"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import CourseForm from "@/components/admin/CourseForm";
import VideoUpload, { type UploadedVideo } from "@/components/admin/VideoUpload";
import type { Course, Lesson } from "@/lib/types";

// Shared by /admin/courses/[id] and /teacher/courses/[id] — course info + lesson manager.
// Ownership is enforced server-side (requireCourseOwner); this component just renders.
export default function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLang();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // new-lesson form state
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState(0);
  const [video, setVideo] = useState<UploadedVideo | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api<{ course: Course; lessons: Lesson[] }>(`/api/courses/${id}`);
      setCourse(res.course);
      setLessons(res.lessons);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function addLesson(e: FormEvent) {
    e.preventDefault();
    if (!video) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/courses/${id}/lessons`, {
        method: "POST",
        body: {
          titleAr,
          titleEn,
          isFree,
          price: isFree ? 0 : price,
          order: lessons.length + 1,
          muxAssetId: video.assetId,
          muxPlaybackId: video.playbackId,
          duration: video.duration,
          status: "ready",
        },
      });
      setTitleAr("");
      setTitleEn("");
      setIsFree(false);
      setPrice(0);
      setVideo(null);
      setShowAdd(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeLesson(lessonId: string) {
    if (!confirm(t("confirmDelete"))) return;
    await api(`/api/courses/${id}/lessons/${lessonId}`, { method: "DELETE" });
    await load();
  }

  async function toggleFree(lesson: Lesson) {
    await api(`/api/courses/${id}/lessons/${lesson.id}`, {
      method: "PUT",
      body: { isFree: !lesson.isFree },
    });
    await load();
  }

  async function updateLessonPrice(lesson: Lesson, next: number) {
    if (next === (lesson.price ?? 0)) return;
    await api(`/api/courses/${id}/lessons/${lesson.id}`, {
      method: "PUT",
      body: { price: next },
    });
    await load();
  }

  if (loading) return <p className="py-16 text-center text-ink/50">{t("loading")}</p>;
  if (!course) return <p className="py-16 text-center text-ink/50">404</p>;

  return (
    <div className="rise space-y-8">
      <div>
        <h1 className="mb-6 text-2xl font-extrabold">
          {t("edit")}: {lang === "ar" ? course.titleAr : course.titleEn}
        </h1>
        <CourseForm course={course} />
      </div>

      {/* Lessons manager */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("lessons")}</h2>
          <button onClick={() => setShowAdd((s) => !s)} className="btn-amber">
            {showAdd ? t("cancel") : `+ ${t("addLesson")}`}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={addLesson} className="card mb-5 space-y-4 border-amber-500/40 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{t("titleAr")}</label>
                <input
                  className="input"
                  dir="rtl"
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">{t("titleEn")}</label>
                <input
                  className="input"
                  dir="ltr"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="accent-moss-500"
                />
                {t("freeLessonToggle")}
              </label>
              {!isFree && (
                <div>
                  <label className="label">
                    {t("lessonPrice")} ({t("egp")})
                  </label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    dir="ltr"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
              )}
            </div>

            <div>
              <label className="label">{t("lessonVideo")}</label>
              <VideoUpload onReady={setVideo} />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button className="btn-primary" disabled={!video || saving}>
              {saving ? t("loading") : t("save")}
            </button>
          </form>
        )}

        {lessons.length === 0 ? (
          <p className="card p-10 text-center text-ink/50">{t("noItems")}</p>
        ) : (
          <ol className="space-y-2">
            {lessons.map((lesson, i) => (
              <li key={lesson.id} className="card flex flex-wrap items-center gap-4 px-5 py-3.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-moss-500/10 font-display text-sm font-bold text-moss-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {lang === "ar" ? lesson.titleAr : lesson.titleEn}
                  </p>
                  <p className="text-xs text-ink/45" dir="ltr">
                    {lesson.muxPlaybackId
                      ? `mux: ${lesson.muxPlaybackId.slice(0, 12)}…`
                      : t("preparing")}
                  </p>
                </div>
                {!lesson.isFree && (
                  <input
                    className="input !w-28 !py-1.5 text-xs"
                    type="number"
                    min={0}
                    dir="ltr"
                    defaultValue={lesson.price ?? 0}
                    onBlur={(e) => updateLessonPrice(lesson, Number(e.target.value))}
                    title={t("lessonPrice")}
                  />
                )}
                <button
                  onClick={() => toggleFree(lesson)}
                  className={`chip !py-1 text-xs ${
                    lesson.isFree
                      ? "bg-amber-500/15 text-amber-600"
                      : "bg-ink/5 text-ink/50"
                  }`}
                >
                  {lesson.isFree ? t("freeLesson") : t("locked")}
                </button>
                <button
                  onClick={() => removeLesson(lesson.id)}
                  className="btn-danger !px-3 !py-1.5 text-xs"
                >
                  {t("delete")}
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
