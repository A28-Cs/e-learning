"use client";

import { useLang } from "@/context/AppProviders";

export default function TeacherCodeRequestsPage() {
  const { t } = useLang();
  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("teacherCodeRequests")}</h1>
      <p className="card p-12 text-center text-ink/50">{t("comingSoon")}</p>
    </div>
  );
}
