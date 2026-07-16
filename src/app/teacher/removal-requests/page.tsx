"use client";

import { useLang } from "@/context/AppProviders";

export default function TeacherRemovalRequestsPage() {
  const { t } = useLang();
  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("teacherRemovalRequests")}</h1>
      <p className="card p-12 text-center text-ink/50">{t("comingSoon")}</p>
    </div>
  );
}
