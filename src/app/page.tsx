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

  const visible =
    activeCat === "all" ? courses : courses.filter((c) => c.categoryId === activeCat);

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
          <p className="rise mb-4 inline-block rounded-full border border-moss-500/30 bg-moss-500/10 px-4 py-1.5 text-xs font-bold tracking-wide text-moss-600">
            {t("heroKicker")}
          </p>
          <h1 className="rise max-w-3xl text-4xl font-extrabold leading-[1.15] sm:text-6xl" style={{ animationDelay: "80ms" }}>
            {t("heroTitle1")}{" "}
            <span className="relative inline-block text-moss-500">
              {t("heroTitle2")}
              <svg
                className="absolute -bottom-2 start-0 w-full"
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

      {/* Catalog */}
      <section id="courses" className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCat("all")}
            className={`chip ${
              activeCat === "all"
                ? "bg-ink text-paper"
                : "border border-ink/15 hover:border-ink/40"
            }`}
          >
            {t("allCategories")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`chip ${
                activeCat === c.id
                  ? "bg-ink text-paper"
                  : "border border-ink/15 hover:border-ink/40"
              }`}
            >
              {lang === "ar" ? c.nameAr : c.nameEn}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-16 text-center text-ink/50">{t("loading")}</p>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-ink/50">{t("noCourses")}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((course, i) => (
              <CourseCard key={course.id} course={course} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
