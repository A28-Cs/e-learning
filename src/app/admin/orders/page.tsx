"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";
import type { Order } from "@/lib/types";

export default function AdminOrdersPage() {
  const { t, lang } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Order[]>("/api/pay/orders")
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusChip = (status: string) =>
    status === "paid"
      ? "bg-moss-500/10 text-moss-600"
      : status === "pending"
        ? "bg-amber-500/15 text-amber-600"
        : "bg-red-50 text-red-600";

  const statusLabel = (status: string) =>
    status === "paid" ? t("paid") : status === "pending" ? t("pendingOrder") : t("failedOrder");

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("adminOrders")}</h1>

      {loading ? (
        <p className="py-16 text-center text-ink/50">{t("loading")}</p>
      ) : orders.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noItems")}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                <th className="px-5 py-3 text-start">{t("forCourse")}</th>
                <th className="px-5 py-3 text-start">{t("student")}</th>
                <th className="px-5 py-3 text-start">{t("price")}</th>
                <th className="px-5 py-3 text-start">{t("status")}</th>
                <th className="px-5 py-3 text-start">{t("date")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-3 font-semibold">
                    {lang === "ar" ? o.courseTitleAr : o.courseTitleEn}
                  </td>
                  <td className="px-5 py-3 text-xs text-ink/60" dir="ltr">
                    {o.email}
                  </td>
                  <td className="px-5 py-3 tabular-nums" dir="ltr">
                    {(o.amountCents / 100).toLocaleString()} {t("egp")}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`chip !py-0.5 text-xs ${statusChip(o.status)}`}>
                      {statusLabel(o.status)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink/50" dir="ltr">
                    {new Date(o.createdAt).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
