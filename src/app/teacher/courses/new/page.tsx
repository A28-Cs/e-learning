"use client";

import CourseForm from "@/components/admin/CourseForm";
import { useLang } from "@/context/AppProviders";

export default function NewTeacherCoursePage() {
  const { t } = useLang();
  return (
    <div className="rise">
      <h1 className="mb-6 text-2xl font-extrabold">{t("newCourse")}</h1>
      <CourseForm basePath="/teacher/courses" />
      <p className="mt-4 text-sm text-ink/50">{t("saveFirst")}</p>
    </div>
  );
}
