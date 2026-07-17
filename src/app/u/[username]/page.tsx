"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import type { Role } from "@/lib/types";

interface PublicProfile {
  uid: string;
  name: string;
  username: string;
  bio: string;
  photoURL: string;
  role: Role;
  createdAt: number;
}
interface CourseLite {
  id: string;
  titleAr: string;
  titleEn: string;
  thumbnail: string;
  price: number;
  currency: string;
}

const roleKey: Record<Role, "roleAdmin" | "roleTeacher" | "roleStudent"> = {
  admin: "roleAdmin",
  teacher: "roleTeacher",
  student: "roleStudent",
};

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { t, lang } = useLang();
  const [data, setData] = useState<{ profile: PublicProfile; courses: CourseLite[] } | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    api<{ profile: PublicProfile; courses: CourseLite[] }>(`/api/users/${username}`)
      .then((d) => {
        setData(d);
        setState("ok");
      })
      .catch(() => setState("missing"));
  }, [username]);

  if (state === "loading") return <p className="py-24 text-center text-ink/50">{t("loading")}</p>;
  if (state === "missing" || !data) {
    return <p className="py-24 text-center text-ink/50">{t("profileNotFound")}</p>;
  }

  const { profile, courses } = data;
  const since = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")
    : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="card rise flex flex-col items-center p-8 text-center">
        <div className="relative h-28 w-28 overflow-hidden rounded-full bg-moss-100">
          {profile.photoURL ? (
            <Image src={profile.photoURL} alt={profile.name} fill className="object-cover" sizes="112px" />
          ) : (
            <span className="grid h-full w-full place-items-center font-display text-4xl font-bold text-moss-500">
              {(profile.name || profile.username || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <h1 className="mt-4 text-2xl font-extrabold">{profile.name || profile.username}</h1>
        <p className="text-ink/50" dir="ltr">@{profile.username}</p>
        <span className="chip mt-3 bg-moss-500/10 text-xs font-bold text-moss-600">
          {t(roleKey[profile.role])}
        </span>
        {profile.bio && (
          <p className="mt-4 max-w-lg whitespace-pre-line leading-relaxed text-ink/70">{profile.bio}</p>
        )}
        {since && (
          <p className="mt-4 text-xs text-ink/40">
            {t("memberSince")} {since}
          </p>
        )}
      </div>

      {profile.role === "teacher" && courses.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-xl font-bold">{t("teacherCoursesPublic")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/course/${c.id}`}
                className="card overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="relative aspect-video bg-moss-100">
                  {c.thumbnail && (
                    <Image
                      src={c.thumbnail}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 300px"
                    />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold">{lang === "ar" ? c.titleAr : c.titleEn}</p>
                  <p className="mt-1 font-display font-bold text-moss-600">
                    {c.price > 0 ? `${c.price.toLocaleString()} ${t("egp")}` : t("free")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
