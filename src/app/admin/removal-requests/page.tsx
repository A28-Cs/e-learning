"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { RemovalRequest } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";

const statusKey: Record<RemovalRequest["status"], DictKey> = {
  pending: "statusPending",
  contacted_student: "statusContacted",
  approved: "statusApproved",
  rejected: "statusRejected",
};
const statusClass: Record<RemovalRequest["status"], string> = {
  pending: "bg-amber-500/15 text-amber-600",
  contacted_student: "bg-blue-500/15 text-blue-600",
  approved: "bg-moss-500/15 text-moss-600",
  rejected: "bg-red-500/15 text-red-600",
};

export default function AdminRemovalRequestsPage() {
  const { t, lang } = useLang();
  const [requests, setRequests] = useState<RemovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(true);

  const load = () => {
    api<RemovalRequest[]>("/api/removal-requests")
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function decide(id: string, action: "contact" | "approve" | "reject") {
    if (action === "approve" && !confirm(t("confirmApproveRemoval"))) return;
    setBusy(id);
    try {
      await api(`/api/removal-requests/${id}`, { method: "PUT", body: { action } });
      load();
    } finally {
      setBusy("");
    }
  }

  const isOpen = (r: RemovalRequest) => r.status === "pending" || r.status === "contacted_student";
  const visible = onlyOpen ? requests.filter(isOpen) : requests;
  const openCount = requests.filter(isOpen).length;
  const title = (r: RemovalRequest) => (lang === "ar" ? r.courseTitleAr : r.courseTitleEn);

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("adminRemovalRequests")}</h1>

      <div className="mb-5 flex gap-1.5">
        <button
          onClick={() => setOnlyOpen(true)}
          className={`chip ${onlyOpen ? "bg-moss-500/10 text-moss-600" : "border border-ink/15 text-ink/70"}`}
        >
          {t("statusPending")}
          {openCount ? ` (${openCount})` : ""}
        </button>
        <button
          onClick={() => setOnlyOpen(false)}
          className={`chip ${!onlyOpen ? "bg-moss-500/10 text-moss-600" : "border border-ink/15 text-ink/70"}`}
        >
          {t("roleAll")}
        </button>
      </div>

      {loading ? (
        <p className="py-16 text-center text-ink/50">{t("loading")}</p>
      ) : visible.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noRequests")}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <li key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{title(r)}</p>
                  <p className="text-xs text-ink/50" dir="ltr">
                    {r.studentEmail} · {r.teacherName}
                  </p>
                </div>
                <span className={`chip text-xs ${statusClass[r.status]}`}>
                  {t(statusKey[r.status])}
                </span>
              </div>
              <p className="mt-3 rounded-lg bg-ink/5 p-3 text-sm text-ink/80">
                <span className="font-semibold">{t("reason")}: </span>
                {r.reason}
              </p>
              {isOpen(r) && (
                <div className="mt-4 flex flex-wrap justify-end gap-1.5">
                  {r.status === "pending" && (
                    <button
                      onClick={() => decide(r.id, "contact")}
                      disabled={busy === r.id}
                      className="btn-ghost !px-3 !py-1.5 text-xs"
                    >
                      {t("markContacted")}
                    </button>
                  )}
                  <button
                    onClick={() => decide(r.id, "approve")}
                    disabled={busy === r.id}
                    className="btn-danger !px-3 !py-1.5 text-xs"
                  >
                    {t("removeStudent")}
                  </button>
                  <button
                    onClick={() => decide(r.id, "reject")}
                    disabled={busy === r.id}
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                  >
                    {t("reject")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
