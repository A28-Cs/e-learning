"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import type { PaymentRequest } from "@/lib/types";

export default function AdminPaymentRequestsPage() {
  const { t, lang } = useLang();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const load = useCallback(() => {
    api<PaymentRequest[]>("/api/payment-requests")
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function review(id: string, action: "approve" | "reject") {
    const note = action === "reject" ? (window.prompt(t("rejectionReason")) ?? "") : "";
    await api(`/api/payment-requests/${id}`, { method: "PUT", body: { action, note } });
    load();
  }

  const visible =
    filter === "pending" ? requests.filter((r) => r.status === "pending") : requests;

  const statusChip = (status: string) =>
    status === "approved"
      ? "bg-moss-500/10 text-moss-600"
      : status === "pending"
        ? "bg-amber-500/15 text-amber-600"
        : "bg-red-50 text-red-600";

  const statusLabel = (status: string) =>
    status === "approved" ? t("paid") : status === "pending" ? t("pendingOrder") : t("failedOrder");

  return (
    <div className="rise">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{t("adminPaymentRequests")}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`chip ${filter === "pending" ? "bg-ink text-paper" : "border border-ink/15"}`}
          >
            {t("pendingOrder")}
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`chip ${filter === "all" ? "bg-ink text-paper" : "border border-ink/15"}`}
          >
            {t("allCategories")}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-ink/50">{t("loading")}</p>
      ) : visible.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noItems")}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center gap-4 p-4">
              <a
                href={r.receiptUrl}
                target="_blank"
                rel="noreferrer"
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-moss-100"
              >
                <Image src={r.receiptUrl} alt="" fill className="object-cover" sizes="64px" />
              </a>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">
                  {lang === "ar" ? r.courseTitleAr : r.courseTitleEn}
                </p>
                <p className="mt-0.5 text-xs text-ink/55" dir="ltr">
                  {r.email}
                </p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {r.method === "vodafone_cash" ? t("vodafoneCash") : t("instapay")} ·{" "}
                  {t("reference")}: <span dir="ltr">{r.transactionRef}</span>
                </p>
              </div>
              <p className="font-display text-lg font-bold text-moss-600" dir="ltr">
                {r.amount.toLocaleString()} {t("egp")}
              </p>
              <span className={`chip !py-1 text-xs ${statusChip(r.status)}`}>
                {statusLabel(r.status)}
              </span>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => review(r.id, "approve")}
                    className="btn-primary !px-4 !py-2 text-xs"
                  >
                    {t("approve")}
                  </button>
                  <button
                    onClick={() => review(r.id, "reject")}
                    className="btn-danger !px-4 !py-2 text-xs"
                  >
                    {t("reject")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
