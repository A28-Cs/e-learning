"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";

interface Stats {
  courses: number;
  students: number;
  codesUsed: number;
  lessons: number;
}

export default function AdminDashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>("/api/admin/stats").then(setStats).catch(() => {});
  }, []);

  const tiles = [
    { label: t("statCourses"), value: stats?.courses, href: "/admin/courses" },
    { label: t("statLessons"), value: stats?.lessons, href: "/admin/courses" },
    { label: t("statStudents"), value: stats?.students, href: "/admin/codes" },
    { label: t("statCodesUsed"), value: stats?.codesUsed, href: "/admin/codes" },
  ];

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("adminDashboard")}</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
        <Link href="/admin/courses/new" className="btn-primary">
          + {t("newCourse")}
        </Link>
        <Link href="/admin/codes" className="btn-amber">
          {t("generateCodes")}
        </Link>
      </div>
    </div>
  );
}
