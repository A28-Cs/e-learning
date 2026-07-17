"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useLang } from "@/context/AppProviders";
import CourseCard from "@/components/CourseCard";
import StarRating from "@/components/StarRating";
import type { Category, Course, Testimonial } from "@/lib/types";

/* ---- animated counter (easyT-style) ---- */
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (value <= 0) {
      setN(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // rAF is throttled in background tabs — make sure we always land on the final value
    const settle = setTimeout(() => setN(value), dur + 200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [value]);
  return <>{n.toLocaleString()}</>;
}

const faqs = [
  {
    qAr: "هل أقدر أبدأ من الصفر من غير خبرة سابقة؟",
    qEn: "Can I start from zero without prior experience?",
    aAr: "أكيد! الكورسات مصممة تاخدك خطوة بخطوة من الأساسيات لحد الاحتراف، وكل درس مبني على اللي قبله.",
    aEn: "Absolutely! Courses take you step by step from the basics to mastery — every lesson builds on the previous one.",
  },
  {
    qAr: "إزاي أشترك في كورس؟",
    qEn: "How do I enroll in a course?",
    aAr: "بتدفع بفودافون كاش أو إنستاباي، أو بتستخدم كود تفعيل بيوصلك — بتدخله في صفحة الكورس والمحتوى بيتفتح فورًا.",
    aEn: "Pay via Vodafone Cash or InstaPay, or use an activation code — enter it on the course page and the content unlocks instantly.",
  },
  {
    qAr: "هل أقدر أتفرج من أي جهاز؟",
    qEn: "Can I watch on any device?",
    aAr: "أيوه، الموقع شغال على الموبايل والتابلت واللابتوب، وتقدمك محفوظ لحسابك — تكمل من المكان اللي وقفت عنده.",
    aEn: "Yes — the site works on mobile, tablet, and laptop, and your progress is saved to your account so you continue where you left off.",
  },
  {
    qAr: "الكورس بيفضل متاح ليا قد إيه؟",
    qEn: "How long do I keep access to a course?",
    aAr: "بمجرد تفعيل الكورس على حسابك بيفضل متاح ليك دايمًا، وتقدر ترجع لأي درس في أي وقت.",
    aEn: "Once activated on your account, the course stays yours — rewatch any lesson anytime.",
  },
  {
    qAr: "لو حصلت مشكلة في الدفع أو التفعيل؟",
    qEn: "What if I have a payment or activation problem?",
    aAr: "فريقنا بيراجع طلبات الدفع بسرعة، ولو الكود مشتغلش تواصل معانا وهنحل المشكلة في أقرب وقت.",
    aEn: "Our team reviews payment requests quickly — if a code fails, contact us and we will fix it as soon as possible.",
  },
];

export default function HomePage() {
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [realTestimonials, setRealTestimonials] = useState<Testimonial[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/testimonials")
        .then((r) => r.json())
        .catch(() => ({ reviews: [] })),
    ])
      .then(([c, cats, testi]) => {
        if (Array.isArray(c)) setCourses(c);
        if (Array.isArray(cats)) setCategories(cats);
        if (Array.isArray(testi?.reviews)) setRealTestimonials(testi.reviews);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalLessons = courses.reduce((s, c) => s + (c.lessonsCount || 0), 0);

  const featured = courses.filter((c) => c.featured);
  const visible = (
    activeCat === "all" ? courses : courses.filter((c) => c.categoryId === activeCat)
  )
    .slice()
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt - a.createdAt);

  const mainList =
    activeCat === "all" && featured.length > 0
      ? visible.filter((c) => !c.featured)
      : visible;

  // Only real testimonials from students who completed a course are shown.
  const realItems = realTestimonials.map((r) => ({
    key: `real-${r.uid}`,
    text: r.comment,
    name: r.name || t("anonymousStudent"),
    role: t("platformStudent"),
    rating: r.rating,
  }));
  // Duplicate for the seamless marquee loop (and so a couple of reviews still fill the row).
  const marqueeItems = [...realItems, ...realItems, ...realItems].slice(
    0,
    Math.max(realItems.length, realItems.length * 2)
  );

  return (
    <div>
      {/* ============ Hero (easyT-style, centered) ============ */}
      <section className="relative overflow-hidden border-b border-ink/10">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-14rem] h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-moss-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-8rem] start-[-8rem] h-72 w-72 rounded-full bg-amber-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-6rem] end-[-6rem] h-64 w-64 rounded-full bg-moss-500/10 blur-3xl"
        />

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:pt-28">
          <p className="rise mx-auto inline-block rounded-full border border-moss-500/30 bg-moss-500/10 px-4 py-1.5 text-xs font-bold tracking-wide text-moss-600">
            ✦ {t("heroBadge")}
          </p>

          <h1
            className="rise mx-auto mt-7 max-w-4xl text-4xl font-extrabold leading-[1.3] sm:text-6xl sm:leading-[1.25]"
            style={{ animationDelay: "80ms" }}
          >
            {t("heroBig1")}{" "}
            <span className="relative inline-block text-moss-500">
              {t("heroBig2")}
              <svg
                className="absolute -bottom-1 start-0 w-full"
                viewBox="0 0 200 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M3 9C50 3 150 3 197 9"
                  stroke="#E9A13B"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p
            className="rise mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink/65 sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {t("heroBigSub")}
          </p>

          <a
            href="#courses"
            className="btn-primary rise mt-8 !rounded-full !px-10 !py-4 !text-base"
            style={{ animationDelay: "240ms" }}
          >
            {t("startJourney")} ←
          </a>

          {/* stats counters */}
          <div
            className="rise mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
            style={{ animationDelay: "320ms" }}
          >
            {[
              { value: courses.length, label: t("statCoursesLabel") },
              { value: totalLessons, label: t("statLessonsLabel") },
              { value: categories.length, label: t("statCategoriesLabel") },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-2xl border border-ink/10 bg-white/70 px-6 py-5 backdrop-blur"
              >
                <div className="font-display text-3xl font-extrabold text-moss-600">
                  <CountUp value={s.value} />
                  <span className="text-amber-500">+</span>
                </div>
                <div className="mt-1 text-xs font-semibold leading-relaxed text-ink/55">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Courses (numbered easyT cards) ============ */}
      <section id="courses" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            {t("coursesForYou")}
          </h2>
          <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-amber-500" />
        </div>

        {/* category filter chips */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setActiveCat("all")}
            className={`chip border ${
              activeCat === "all"
                ? "border-moss-500 bg-moss-500 text-white"
                : "border-ink/15 bg-white text-ink/70 hover:border-moss-500 hover:text-moss-600"
            }`}
          >
            {t("allCategories")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`chip border ${
                activeCat === c.id
                  ? "border-moss-500 bg-moss-500 text-white"
                  : "border-ink/15 bg-white text-ink/70 hover:border-moss-500 hover:text-moss-600"
              }`}
            >
              {lang === "ar" ? c.nameAr : c.nameEn}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-16 text-center text-ink/50">{t("loading")}</p>
        ) : (
          <>
            {activeCat === "all" && featured.length > 0 && (
              <div className="mb-12">
                <h3 className="mb-5 flex items-center gap-2 font-display text-2xl font-extrabold">
                  <span className="text-amber-500">★</span> {t("featuredCourses")}
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {featured.map((course, i) => (
                    <CourseCard key={course.id} course={course} index={i} />
                  ))}
                </div>
              </div>
            )}

            {mainList.length === 0 && featured.length === 0 ? (
              <p className="py-16 text-center text-ink/50">{t("noCourses")}</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {mainList.map((course, i) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    index={activeCat === "all" ? featured.length + i : i}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ============ Testimonials marquee (real reviews only) ============ */}
      {realItems.length > 0 && (
      <section className="overflow-hidden border-y border-ink/10 bg-white/50 py-16">
        <div className="mx-auto mb-10 max-w-6xl px-4 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            {t("testimonialsTitle")}
          </h2>
          <p className="mt-3 text-sm text-ink/55">{t("testimonialsSub")}</p>
          <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-amber-500" />
        </div>

        <div dir="ltr" className="marquee-mask relative">
          <div className="marquee-track flex w-max gap-5">
            {marqueeItems.map((item, i) => (
              <figure
                key={`${item.key}-${i}`}
                dir={lang === "ar" ? "rtl" : "ltr"}
                className="card w-80 shrink-0 p-6 sm:w-96"
              >
                <blockquote className="text-sm leading-relaxed text-ink/75">
                  “{item.text}”
                </blockquote>
                <figcaption className="mt-5 flex items-center justify-between gap-3 border-t border-ink/5 pt-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-moss-500/10 font-display font-bold text-moss-600">
                      {item.name.charAt(0)}
                    </span>
                    <div>
                      <div className="text-sm font-bold">{item.name}</div>
                      <div className="text-xs text-ink/50">{item.role}</div>
                    </div>
                  </div>
                  {item.rating && <StarRating value={item.rating} size="sm" />}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ============ FAQ ============ */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            {t("faqTitle")}
          </h2>
          <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-amber-500" />
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const open = openFaq === i;
            return (
              <div
                key={i}
                className={`card overflow-hidden transition-shadow ${
                  open ? "shadow-lift" : ""
                }`}
              >
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                >
                  <span className="font-display text-sm font-bold sm:text-base">
                    {lang === "ar" ? f.qAr : f.qEn}
                  </span>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg transition-all ${
                      open
                        ? "rotate-45 bg-moss-500 text-white"
                        : "bg-moss-500/10 text-moss-600"
                    }`}
                  >
                    +
                  </span>
                </button>
                {open && (
                  <p className="border-t border-ink/5 px-5 py-4 text-sm leading-relaxed text-ink/65">
                    {lang === "ar" ? f.aAr : f.aEn}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ Final CTA (logged-out visitors only) ============ */}
      {!authLoading && !user && (
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-moss-700 px-6 py-14 text-center text-white sm:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 start-[-4rem] h-56 w-56 rounded-full bg-moss-500/40 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute bottom-[-5rem] end-[-4rem] h-56 w-56 rounded-full bg-amber-500/25 blur-3xl"
            />
            <h2 className="relative font-display text-3xl font-extrabold sm:text-4xl">
              {t("readyTitle")}
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
              {t("readySub")}
            </p>
            <Link
              href="/register"
              className="btn-amber relative mt-8 !rounded-full !px-10 !py-4 !text-base"
            >
              {t("createAccount")}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
