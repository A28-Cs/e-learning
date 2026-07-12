"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import type { Category } from "@/lib/types";

export default function AdminCategoriesPage() {
  const { t } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((c) => Array.isArray(c) && setCategories(c));
  }, []);

  useEffect(load, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/categories", {
        method: "POST",
        body: { nameAr, nameEn, order: categories.length + 1 },
      });
      setNameAr("");
      setNameEn("");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    await api(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("adminCategories")}</h1>

      <form onSubmit={add} className="card mb-6 grid gap-4 p-6 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="label">{t("nameAr")}</label>
          <input
            className="input"
            dir="rtl"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">{t("nameEn")}</label>
          <input
            className="input"
            dir="ltr"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <button className="btn-primary" disabled={busy}>
            + {t("newCategory")}
          </button>
        </div>
      </form>

      {categories.length === 0 ? (
        <p className="card p-10 text-center text-ink/50">{t("noItems")}</p>
      ) : (
        <div className="space-y-2">
          {categories.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 px-5 py-3.5">
              <span className="flex-1 font-semibold">{c.nameAr}</span>
              <span className="flex-1 text-ink/60" dir="ltr">
                {c.nameEn}
              </span>
              <button
                onClick={() => remove(c.id)}
                className="btn-danger !px-3 !py-1.5 text-xs"
              >
                {t("delete")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
