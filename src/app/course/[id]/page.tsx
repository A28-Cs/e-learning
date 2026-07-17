"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import CheckoutButton from "@/components/CheckoutButton";
import CourseExams from "@/components/CourseExams";
import RatingBadge from "@/components/RatingBadge";
import ReviewList from "@/components/ReviewList";
import type { Course, Lesson } from "@/lib/types";

interface CourseResponse {
  course: Course;
  lessons: Lesson[];
  enrolled: boolean;
}

function fmtDuration(sec: number): string {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useLang();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<"idle" | "busy" | "ok" | "bad">("idle");
  const [payState, setPayState] = useState<"idle" | "busy" | "error">("idle");
  const [cancelState, setCancelState] = useState<"idle" | "busy" | "started">("idle");

  const paymentsEnabled = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "1";

  async function buyNow() {
    if (!user) {
      router.push("/login");
      return;
    }
    setPayState("busy");
    try {
      const res = await api<{ url: string }>("/api/pay/checkout", {
        method: "POST",
        body: { courseId: id },
      });
      window.location.href = res.url;
    } catch {
      setPayState("error");
    }
  }

  const load = useCallback(async () => {
    try {
      const res = await api<CourseResponse>(`/api/courses/${id}`);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading) load();
  }, [authLoading, user, load]);

  async function cancelEnrollment() {
    if (!confirm(t("confirmCancelEnrollment"))) return;
    setCancelState("busy");
    try {
      await api(`/api/courses/${id}/cancel-enrollment`, { method: "POST" });
      await refreshProfile();
      await load();
      setCancelState("idle");
    } catch (err) {
      setCancelState((err as Error).message === "already_started" ? "started" : "idle");
    }
  }

  async function redeem(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    setCodeState("busy");
    try {
      await api("/api/codes/redeem", { method: "POST", body: { code } });
      setCodeState("ok");
      await refreshProfile();
      await load();
    } catch {
      setCodeState("bad");
    }
  }

  if (loading || authLoading) {
    return <p className="py-24 text-center text-ink/50">{t("loading")}</p>;
  }
  if (!data) {
    return <p className="py-24 text-center text-ink/50">404</p>;
  }

  const { course, lessons, enrolled } = data;
  const title = lang === "ar" ? course.titleAr : course.titleEn;
  const desc = lang === "ar" ? course.descAr : course.descEn;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Main */}
        <div className="rise">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
            <RatingBadge avg={course.ratingAvg} count={course.ratingCount} />
          </div>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-ink/70">{desc}</p>

          <h2 className="mt-10 text-xl font-bold">{t("courseContent")}</h2>
          <ol className="mt-4 space-y-2">
            {lessons.map((lesson, i) => {
              const lTitle = lang === "ar" ? lesson.titleAr : lesson.titleEn;
              const canWatch = enrolled || lesson.isFree;
              const ready = lesson.status === "ready";
              const row = (
                <div
                  className={`card flex items-center gap-4 px-5 py-4 ${
                    canWatch && ready
                      ? "transition-all hover:border-moss-500/40 hover:shadow-lift"
                      : "opacity-70"
                  }`}
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-moss-500/10 font-display text-sm font-bold text-moss-600">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium">{lTitle}</span>
                  {!ready ? (
                    <span className="text-xs font-semibold text-amber-600">{t("preparing")}</span>
                  ) : lesson.isFree && !enrolled ? (
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-600">
                      {t("freeLesson")}
                    </span>
                  ) : !canWatch ? (
                    <span className="text-xs text-ink/40">🔒 {t("locked")}</span>
                  ) : (
                    <span className="text-xs font-semibold text-moss-600">▶ {t("watchNow")}</span>
                  )}
                  {lesson.duration > 0 && (
                    <span className="text-xs tabular-nums text-ink/40" dir="ltr">
                      {fmtDuration(lesson.duration)}
                    </span>
                  )}
                </div>
              );
              return (
                <li key={lesson.id}>
                  {canWatch && ready ? (
                    <Link href={`/watch/${course.id}/${lesson.id}`}>{row}</Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
            {lessons.length === 0 && (
              <p className="text-sm text-ink/50">{t("noItems")}</p>
            )}
          </ol>

          {enrolled && <CourseExams courseId={course.id} />}

          <h2 className="mt-12 text-xl font-bold">{t("courseReviews")}</h2>
          <div className="mt-4">
            <ReviewList
              fetchUrl={`/api/courses/${course.id}/reviews`}
              postUrl={`/api/courses/${course.id}/reviews`}
              eligible={enrolled}
              ineligibleMessage={!user ? t("loginToReview") : t("enrollToReview")}
              onSubmitted={load}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="rise" style={{ animationDelay: "120ms" }}>
          <div className="card sticky top-24 overflow-hidden">
            <div className="relative aspect-video bg-moss-100">
              {course.thumbnail && (
                <Image
                  src={course.thumbnail}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="380px"
                />
              )}
            </div>
            <div className="p-6">
              <p className="font-display text-3xl font-extrabold text-moss-600">
                {course.price > 0
                  ? `${course.price.toLocaleString()} ${t("egp")}`
                  : t("free")}
              </p>

              {enrolled ? (
                <>
                  <p className="mt-4 rounded-xl bg-moss-500/10 px-4 py-3 text-center font-bold text-moss-600">
                    {t("enrolled")}
                  </p>
                  {user && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={cancelEnrollment}
                        disabled={cancelState === "busy"}
                        className="text-xs font-semibold text-ink/50 hover:text-red-600 hover:underline"
                      >
                        {cancelState === "busy" ? t("loading") : t("cancelEnrollment")}
                      </button>
                      {cancelState === "started" && (
                        <p className="mt-2 text-xs text-red-600">{t("cannotCancelStarted")}</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {paymentsEnabled && course.price > 0 && (
                    <>
                      <button
                        onClick={buyNow}
                        disabled={payState === "busy"}
                        className="btn-primary mt-4 w-full !py-3"
                      >
                        {payState === "busy" ? t("redirectingToPay") : `💳 ${t("buyNow")}`}
                      </button>
                      {payState === "error" && (
                        <p className="mt-2 text-center text-xs text-red-600">{t("payFailed")}</p>
                      )}
                      <div className="mt-4 flex items-center gap-3 text-xs text-ink/40">
                        <span className="h-px flex-1 bg-ink/10" />
                        {t("orDivider")}
                        <span className="h-px flex-1 bg-ink/10" />
                      </div>
                    </>
                  )}
                  {course.price > 0 && <CheckoutButton courseId={course.id} user={user} />}
                  <p className="mt-4 text-sm leading-relaxed text-ink/60">{t("howToBuy")}</p>
                  <form onSubmit={redeem} className="mt-4 space-y-2">
                    <label className="label">{t("haveCode")}</label>
                    <input
                      className="input text-center font-mono uppercase tracking-widest"
                      dir="ltr"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={t("codePlaceholder")}
                      required
                    />
                    <button className="btn-amber w-full" disabled={codeState === "busy"}>
                      {codeState === "busy" ? t("loading") : t("activate")}
                    </button>
                    {!user && (
                      <p className="text-center text-xs text-ink/50">{t("loginToActivate")}</p>
                    )}
                    {codeState === "ok" && (
                      <p className="text-center text-sm font-bold text-moss-600">
                        {t("codeSuccess")}
                      </p>
                    )}
                    {codeState === "bad" && (
                      <p className="text-center text-sm font-medium text-red-600">
                        {t("codeInvalid")}
                      </p>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
