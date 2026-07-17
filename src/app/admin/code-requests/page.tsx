"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { CodeRequest } from "@/lib/types";
import type { DictKey } from "@/lib/i18n";

const statusKey: Record<CodeRequest["status"], DictKey> = {
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
};
const statusClass: Record<CodeRequest["status"], string> = {
  pending: "bg-amber-500/15 text-amber-600",
  approved: "bg-moss-500/15 text-moss-600",
  rejected: "bg-red-500/15 text-red-600",
};

export default function AdminCodeRequestsPage() {
  const { t, lang } = useLang();
  const [requests, setRequests] = useState<CodeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [onlyPending, setOnlyPending] = useState(true);

  const load = () => {
    api<CodeRequest[]>("/api/code-requests")
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  async function decide(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      await api(`/api/code-requests/${id}`, { method: "PUT", body: { action } });
      load();
    } finally {
      setBusy("");
    }
  }

  const visible = onlyPending ? requests.filter((r) => r.status === "pending") : requests;
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const title = (r: CodeRequest) => (lang === "ar" ? r.courseTitleAr : r.courseTitleEn);

  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("adminCodeRequests")}</h1>

      <div className="mb-5 flex gap-1.5">
        <button
          onClick={() => setOnlyPending(true)}
          className={`chip ${onlyPending ? "bg-moss-500/10 text-moss-600" : "border border-ink/15 text-ink/70"}`}
        >
          {t("statusPending")}
          {pendingCount ? ` (${pendingCount})` : ""}
        </button>
        <button
          onClick={() => setOnlyPending(false)}
          className={`chip ${!onlyPending ? "bg-moss-500/10 text-moss-600" : "border border-ink/15 text-ink/70"}`}
        >
          {t("roleAll")}
        </button>
      </div>

      {loading ? (
        <p className="py-16 text-center text-ink/50">{t("loading")}</p>
      ) : visible.length === 0 ? (
        <p className="card p-12 text-center text-ink/50">{t("noRequests")}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/50">
                <th className="px-5 py-3 text-start">{t("teacherLabel")}</th>
                <th className="px-5 py-3 text-start">{t("teacherCourses")}</th>
                <th className="px-5 py-3 text-start">{t("studentLabel")}</th>
                <th className="px-5 py-3 text-start">{t("status")}</th>
                <th className="px-5 py-3 text-start">{t("generatedCode")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-5 py-3 font-semibold">{r.teacherName || "—"}</td>
                  <td className="px-5 py-3">{title(r)}</td>
                  <td className="px-5 py-3 text-xs text-ink/60" dir="ltr">
                    {r.studentEmail}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`chip text-xs ${statusClass[r.status]}`}>
                      {t(statusKey[r.status])}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs" dir="ltr">
                    {r.code ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    {r.status === "pending" && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => decide(r.id, "approve")}
                          disabled={busy === r.id}
                          className="btn-primary !px-3 !py-1.5 text-xs"
                        >
                          {t("approve")}
                        </button>
                        <button
                          onClick={() => decide(r.id, "reject")}
                          disabled={busy === r.id}
                          className="btn-danger !px-3 !py-1.5 text-xs"
                        >
                          {t("reject")}
                        </button>
                      </div>
                    )}
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
