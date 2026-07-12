"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import type { PaymentSettings } from "@/lib/types";

export default function AdminSettingsPage() {
  const { t } = useLang();
  const [form, setForm] = useState<PaymentSettings>({
    vodafoneCash: "",
    instapay: "",
    enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/payment")
      .then((r) => r.json())
      .then(setForm)
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await api("/api/settings/payment", { method: "PUT", body: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-ink/50">{t("loading")}</p>;

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("adminSettings")}</h1>
      <form onSubmit={onSubmit} className="card max-w-lg space-y-5 p-6">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
            className="h-4.5 w-4.5 accent-moss-500"
          />
          {t("paymentSettingsEnabled")}
        </label>
        <div>
          <label className="label">{t("vodafoneCashNumber")}</label>
          <input
            className="input"
            dir="ltr"
            value={form.vodafoneCash}
            onChange={(e) => setForm((f) => ({ ...f, vodafoneCash: e.target.value }))}
            placeholder="01xxxxxxxxx"
          />
        </div>
        <div>
          <label className="label">{t("instapayHandle")}</label>
          <input
            className="input"
            dir="ltr"
            value={form.instapay}
            onChange={(e) => setForm((f) => ({ ...f, instapay: e.target.value }))}
            placeholder="yourname@instapay"
          />
        </div>
        <button className="btn-primary" disabled={busy}>
          {busy ? t("loading") : saved ? t("settingsSaved") : t("save")}
        </button>
      </form>
    </div>
  );
}
