"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/context/AppProviders";
import type { Course } from "@/lib/types";

export default function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const { lang, t } = useLang();
  const title = lang === "ar" ? course.titleAr : course.titleEn;
  const desc = lang === "ar" ? course.descAr : course.descEn;
  const num = String(index + 1).padStart(2, "0");

  return (
    <Link
      href={`/course/${course.id}`}
      className="card rise group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
      style={{ animationDelay: `${Math.min(index * 70, 500)}ms` }}
    >
      <div className="relative aspect-video overflow-hidden bg-moss-100">
        {course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="grid h-full w-full place-items-center font-display text-4xl font-bold text-moss-300">
            {title.charAt(0)}
          </div>
        )}
        {course.featured && (
          <span className="absolute top-3 end-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-extrabold text-ink shadow-card">
            ★ {t("featured")}
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col p-5">
        {/* easyT-style index number */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-2 end-4 select-none font-display text-5xl font-extrabold leading-none text-moss-500/10"
        >
          {num}
        </span>

        <div className="flex items-center gap-2 text-xs font-semibold text-ink/50">
          <span className="inline-flex items-center gap-1 rounded-full bg-moss-500/10 px-2.5 py-1 text-moss-600">
            ▶ {course.lessonsCount} {t("lessonsCount")}
          </span>
        </div>

        <h3 className="mt-3 font-display text-lg font-bold leading-snug group-hover:text-moss-600">
          {title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/60">{desc}</p>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between border-t border-ink/5 pt-3">
            <span className="font-display text-xl font-extrabold text-moss-600">
              {course.price > 0
                ? `${course.price.toLocaleString()} ${t("egp")}`
                : t("free")}
            </span>
          </div>
          <span className="btn-primary mt-3 w-full !rounded-full !py-3">
            {t("startJourney")}
          </span>
        </div>
      </div>
    </Link>
  );
}
