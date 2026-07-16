"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { Course } from "@/lib/types";

export default function TeacherDashboard() {
  const { t } = useLang();
  const [courses, setCourses] = useState<Course[] | null>(null);

  useEffect(() => {
    api<Course[]>("/api/courses?mine=1")
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  const published = courses?.filter((c) => c.published).length ?? 0;
  const lessons = courses?.reduce((sum, c) => sum + (c.lessonsCount ?? 0), 0) ?? 0;

  const tiles = [
    { label: t("teacherCourses"), value: courses?.length, href: "/teacher/courses" },
    { label: t("published"), value: published, href: "/teacher/courses" },
    { label: t("statLessons"), value: lessons, href: "/teacher/courses" },
  ];

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("teacherDashboard")}</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {tiles.map((tile, i) => (
          <Link
            key={i}
            href={tile.href}
            className="card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <p className="font-display text-4xl font-extrabold text-moss-600">
              {tile.value ?? "—"}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink/55">{tile.label}</p>
          </Link>
        ))}
      </div>
      <div className="card mt-6 flex flex-wrap gap-3 p-6">
        <Link href="/teacher/courses/new" className="btn-primary">
          + {t("newCourse")}
        </Link>
      </div>
    </div>
  );
}
