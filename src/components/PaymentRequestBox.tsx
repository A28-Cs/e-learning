"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "firebase/auth";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import ImageUpload from "@/components/admin/ImageUpload";
import type { PaymentRequest, PaymentSettings } from "@/lib/types";

export default function PaymentRequestBox({
  courseId,
  user,
}: {
  courseId: string;
  user: User | null;
}) {
  const { t } = useLang();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [mine, setMine] = useState<PaymentRequest | null>(null);
  const [checkedMine, setCheckedMine] = useState(false);
  const [method, setMethod] = useState<"vodafone_cash" | "instapay">("vodafone_cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/payment")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  useEffect(() => {
    if (!user) {
      setCheckedMine(true);
      return;
    }
    api<PaymentRequest | null>(`/api/payment-requests/mine?courseId=${courseId}`)
      .then(setMine)
      .catch(() => setMine(null))
      .finally(() => setCheckedMine(true));
  }, [courseId, user]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const created = await api<PaymentRequest>("/api/payment-requests", {
        method: "POST",
        body: { courseId, method, transactionRef, receiptUrl },
      });
      setMine(created);
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg === "already_pending" ? t("paymentPending") : msg);
    } finally {
      setBusy(false);
    }
  }

  if (!user || !checkedMine || !settings?.enabled) return null;

  if (mine?.status === "pending") {
    return (
      <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-center text-sm font-bold text-amber-600">
        {t("paymentPending")}
      </p>
    );
  }

  const sendTo = method === "vodafone_cash" ? settings.vodafoneCash : settings.instapay;

  return (
    <div className="mt-4 border-t border-ink/10 pt-4">
      {mine?.status === "rejected" && (
        <p className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("paymentRejected")}
          {mine.adminNote && (
            <>
              <br />
              <span className="font-semibold">{t("rejectionReason")}:</span> {mine.adminNote}
            </>
          )}
        </p>
      )}
      <p className="label">{t("payManual")}</p>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMethod("vodafone_cash")}
          className={`chip flex-1 justify-center ${
            method === "vodafone_cash" ? "bg-ink text-paper" : "border border-ink/15"
          }`}
        >
          {t("vodafoneCash")}
        </button>
        <button
          type="button"
          onClick={() => setMethod("instapay")}
          className={`chip flex-1 justify-center ${
            method === "instapay" ? "bg-ink text-paper" : "border border-ink/15"
          }`}
        >
          {t("instapay")}
        </button>
      </div>

      {sendTo && (
        <p
          className="mb-3 rounded-xl bg-moss-500/10 px-4 py-2.5 text-center font-mono text-sm font-bold text-moss-700"
          dir="ltr"
        >
          {t("sendTo")}: {sendTo}
        </p>
      )}

      <form onSubmit={submit} className="space-y-2.5">
        <input
          className="input"
          dir="ltr"
          placeholder={t("transactionRef")}
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          required
        />
        <div>
          <label className="label">{t("uploadReceipt")}</label>
          <ImageUpload value={receiptUrl} onChange={setReceiptUrl} />
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <button className="btn-amber w-full" disabled={busy || !receiptUrl || !transactionRef}>
          {busy ? t("loading") : t("submitPaymentRequest")}
        </button>
      </form>
    </div>
  );
}
