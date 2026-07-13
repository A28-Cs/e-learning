"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/AppProviders";
import CourseCard from "@/components/CourseCard";
import type { Category, Course } from "@/lib/types";

export default function HomePage() {
  const { t, lang } = useLang();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([c, cats]) => {
        if (Array.isArray(c)) setCourses(c);
        if (Array.isArray(cats)) setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  const featured = courses.filter((c) => c.featured);
  const visible = (
    activeCat === "all" ? courses : courses.filter((c) => c.categoryId === activeCat)
  )
    .slice()
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt - a.createdAt);

  // when showing "all" with a featured strip on top, don't repeat them below
  const mainList =
    activeCat === "all" && featured.length > 0
      ? visible.filter((c) => !c.featured)
      : visible;

  const activeCatName =
    activeCat === "all"
      ? t("allCategories")
      : (() => {
          const c = categories.find((x) => x.id === activeCat);
          return c ? (lang === "ar" ? c.nameAr : c.nameEn) : "";
        })();

  function pick(id: string) {
    setActiveCat(id);
    setDrawerOpen(false);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink/10">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 end-[-6rem] h-72 w-72 rounded-full bg-moss-500/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[-4rem] start-[-4rem] h-56 w-56 rounded-full bg-amber-500/15 blur-3xl"
        />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="rise">
            <p className="inline-block rounded-full border border-moss-500/30 bg-moss-500/10 px-4 py-1.5 text-xs font-bold tracking-wide text-moss-600">
              {t("heroKicker")}
            </p>
          </div>
          <h1
            className="rise mt-7 max-w-3xl text-4xl font-extrabold leading-[1.35] sm:text-6xl sm:leading-[1.3]"
            style={{ animationDelay: "80ms" }}
          >
            {t("heroTitle1")}{" "}
            <span className="relative inline-block text-moss-500">
              {t("heroTitle2")}
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
            className="rise mt-6 max-w-xl text-base leading-relaxed text-ink/65 sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            {t("heroSub")}
          </p>
          <a
            href="#courses"
            className="btn-primary rise mt-8 !px-8 !py-3.5 !text-base"
            style={{ animationDelay: "240ms" }}
          >
            {t("browseCourses")}
          </a>
        </div>
      </section>

      {/* Categories drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 start-0 w-72 max-w-[85vw] overflow-y-auto bg-paper p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{t("browseByCategory")}</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-ink/15 text-lg hover:border-moss-500"
                aria-label={t("close")}
              >
                ✕
              </button>
            </div>
            <nav className="space-y-1.5">
              <button
                onClick={() => pick("all")}
                className={`block w-full rounded-xl px-4 py-3 text-start text-sm font-semibold transition-colors ${
                  activeCat === "all"
                    ? "bg-moss-500 text-white"
                    : "bg-white hover:bg-moss-500/10"
                }`}
              >
                {t("allCategories")}
              </button>
              {categories.map((c) => {
                const count = courses.filter((x) => x.categoryId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => pick(c.id)}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-start text-sm font-semibold transition-colors ${
                      activeCat === c.id
                        ? "bg-moss-500 text-white"
                        : "bg-white hover:bg-moss-500/10"
                    }`}
                  >
                    <span>{lang === "ar" ? c.nameAr : c.nameEn}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        activeCat === c.id ? "bg-white/20" : "bg-ink/5 text-ink/50"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Catalog */}
      <section id="courses" className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="btn-ghost !px-5 !py-2.5"
          >
            ☰ {t("browseByCategory")}
          </button>
          <span className="chip bg-ink text-paper">{activeCatName}</span>
        </div>

        {loading ? (
          <p className="py-16 text-center text-ink/50">{t("loading")}</p>
        ) : (
          <>
            {activeCat === "all" && featured.length > 0 && (
              <div className="mb-12">
                <h2 className="mb-5 flex items-center gap-2 font-display text-2xl font-extrabold">
                  <span className="text-amber-500">★</span> {t("featuredCourses")}
                </h2>
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
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
