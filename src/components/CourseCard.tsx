"use client";

import Link from "next/link";
import Image from "next/image";
import { useLang } from "@/context/AppProviders";
import type { Course } from "@/lib/types";

export default function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const { lang, t } = useLang();
  const title = lang === "ar" ? course.titleAr : course.titleEn;
  const desc = lang === "ar" ? course.descAr : course.descEn;

  return (
    <Link
      href={`/course/${course.id}`}
      className="card rise group block overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
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
          <span className="absolute top-3 start-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-extrabold text-ink shadow-card">
            ★ {t("featured")}
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-bold leading-snug group-hover:text-moss-600">
          {title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/60">{desc}</p>
        <div className="mt-4 flex items-end justify-between border-t border-ink/5 pt-3">
          <span className="text-xs font-semibold text-ink/50">
            {course.lessonsCount} {t("lessonsCount")}
          </span>
          <span className="font-display text-xl font-extrabold text-moss-600">
            {course.price > 0
              ? `${course.price.toLocaleString()} ${t("egp")}`
              : t("free")}
          </span>
        </div>
      </div>
    </Link>
  );
}
