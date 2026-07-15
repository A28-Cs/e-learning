"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import CourseCard from "@/components/CourseCard";
import ReviewList from "@/components/ReviewList";
import type { Course, CourseProgress } from "@/lib/types";

export default function MyCoursesPage() {
  const { t } = useLang();
  const { user, profile, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      setFetching(false);
      return;
    }
    fetch("/api/courses")
      .then((r) => r.json())
      .then(async (all: Course[]) => {
        if (!Array.isArray(all)) return;
        const mine = all.filter((c) => profile.enrolledCourses?.includes(c.id));
        setCourses(mine);
        const entries = await Promise.all(
          mine.map(async (c) => {
            try {
              const p = await api<CourseProgress>(`/api/progress/${c.id}`);
              return [c.id, p.completed] as const;
            } catch {
              return [c.id, false] as const;
            }
          })
        );
        setCompletedMap(Object.fromEntries(entries));
      })
      .finally(() => setFetching(false));
  }, [loading, profile]);

  const anyCompleted = Object.values(completedMap).some(Boolean);

  if (loading || fetching) {
    return <p className="py-24 text-center text-ink/50">{t("loading")}</p>;
  }

  if (!user) {
    return (
      <div className="py-24 text-center">
        <Link href="/login" className="btn-primary">
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-extrabold">{t("myCoursesTitle")}</h1>
      {courses.length === 0 ? (
        <div className="card p-12 text-center text-ink/50">
          <p>{t("noEnrollments")}</p>
          <Link href="/" className="btn-primary mt-6">
            {t("browseCourses")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c, i) => (
            <div key={c.id} className="relative">
              {completedMap[c.id] && (
                <span className="absolute -top-2 end-4 z-10 rounded-full bg-moss-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-card">
                  ✓ {t("courseCompleted")}
                </span>
              )}
              <CourseCard course={c} index={i} />
            </div>
          ))}
        </div>
      )}

      {anyCompleted && (
        <div className="rise mt-12">
          <h2 className="mb-2 text-xl font-bold">{t("shareExperienceTitle")}</h2>
          <p className="mb-4 text-sm text-ink/60">{t("shareExperienceSub")}</p>
          <ReviewList
            fetchUrl="/api/testimonials"
            postUrl="/api/testimonials"
            eligible
            showList={false}
          />
        </div>
      )}
    </div>
  );
}
