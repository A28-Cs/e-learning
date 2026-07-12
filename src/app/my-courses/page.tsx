"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useLang } from "@/context/AppProviders";
import CourseCard from "@/components/CourseCard";
import type { Course } from "@/lib/types";

export default function MyCoursesPage() {
  const { t } = useLang();
  const { user, profile, loading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      setFetching(false);
      return;
    }
    fetch("/api/courses")
      .then((r) => r.json())
      .then((all: Course[]) => {
        if (Array.isArray(all)) {
          setCourses(all.filter((c) => profile.enrolledCourses?.includes(c.id)));
        }
      })
      .finally(() => setFetching(false));
  }, [loading, profile]);

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
            <CourseCard key={c.id} course={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
