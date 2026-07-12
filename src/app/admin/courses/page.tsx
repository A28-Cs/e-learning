"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import type { Course } from "@/lib/types";

export default function AdminCoursesPage() {
  const { t, lang } = useLang();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api<Course[]>("/api/courses?all=1")
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    await api(`/api/courses/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="rise">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t("adminCourses")}</h1>
        <Link href="/admin/courses/new" className="btn-primary">
          + {t("newCourse")}
        </Link>
      </div>

      {loading ? (
        <p className="py-16 text-center text-ink/50">{t("loading")}</p>
      ) : courses.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noItems")}</p>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 p-4">
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-moss-100">
                {c.thumbnail && (
                  <Image src={c.thumbnail} alt="" fill className="object-cover" sizes="96px" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {lang === "ar" ? c.titleAr : c.titleEn}
                </p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {c.lessonsCount} {t("lessonsCount")} ·{" "}
                  {c.price > 0 ? `${c.price.toLocaleString()} ${t("egp")}` : t("free")}
                </p>
              </div>
              <span
                className={`chip !py-1 text-xs ${
                  c.published
                    ? "bg-moss-500/10 text-moss-600"
                    : "bg-ink/5 text-ink/50"
                }`}
              >
                {c.published ? t("published") : t("draft")}
              </span>
              <Link href={`/admin/courses/${c.id}`} className="btn-ghost !px-4 !py-2 text-xs">
                {t("edit")}
              </Link>
              <button onClick={() => remove(c.id)} className="btn-danger !px-4 !py-2 text-xs">
                {t("delete")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
