"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";
import { useAuth, useLang } from "@/context/AppProviders";
import ImageUpload from "./ImageUpload";
import type { Category, Course } from "@/lib/types";

export default function CourseForm({
  course,
  basePath = "/admin/courses",
}: {
  course?: Course;
  basePath?: string;
}) {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    titleAr: course?.titleAr ?? "",
    titleEn: course?.titleEn ?? "",
    descAr: course?.descAr ?? "",
    descEn: course?.descEn ?? "",
    categoryId: course?.categoryId ?? "",
    thumbnail: course?.thumbnail ?? "",
    published: course?.published ?? false,
    featured: course?.featured ?? false,
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((c) => Array.isArray(c) && setCategories(c));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (course) {
        await api(`/api/courses/${course.id}`, { method: "PUT", body: form });
        router.refresh();
      } else {
        const created = await api<{ id: string }>("/api/courses", {
          method: "POST",
          body: form,
        });
        router.push(`${basePath}/${created.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t("titleAr")}</label>
          <input
            className="input"
            dir="rtl"
            value={form.titleAr}
            onChange={(e) => set("titleAr", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">{t("titleEn")}</label>
          <input
            className="input"
            dir="ltr"
            value={form.titleEn}
            onChange={(e) => set("titleEn", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t("descAr")}</label>
          <textarea
            className="input min-h-28"
            dir="rtl"
            value={form.descAr}
            onChange={(e) => set("descAr", e.target.value)}
          />
        </div>
        <div>
          <label className="label">{t("descEn")}</label>
          <textarea
            className="input min-h-28"
            dir="ltr"
            value={form.descEn}
            onChange={(e) => set("descEn", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">{t("category")}</label>
          <select
            className="input"
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
          >
            <option value="">—</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {lang === "ar" ? c.nameAr : c.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">
            {t("price")} ({t("egp")})
          </label>
          <p className="input flex items-center bg-ink/5 text-ink/60" dir="ltr">
            {(course?.price ?? 0).toLocaleString()} {t("egp")}
          </p>
          <p className="mt-1 text-xs text-ink/45">{t("priceComputedHint")}</p>
        </div>
        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => set("published", e.target.checked)}
              className="h-4.5 w-4.5 accent-moss-500"
            />
            {t("published")}
          </label>
          {profile?.isAdmin && (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4.5 w-4.5 accent-amber-500"
              />
              ★ {t("featuredToggle")}
            </label>
          )}
        </div>
      </div>

      <div className="max-w-sm">
        <label className="label">{t("thumbnail")}</label>
        <ImageUpload value={form.thumbnail} onChange={(url) => set("thumbnail", url)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button className="btn-primary" disabled={busy}>
        {busy ? t("loading") : t("save")}
      </button>
    </form>
  );
}
