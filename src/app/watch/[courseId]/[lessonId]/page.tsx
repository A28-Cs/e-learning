"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamicImport from "next/dynamic";
import { useAuth, useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";

const MuxPlayer = dynamicImport(() => import("@mux/mux-player-react"), { ssr: false });

interface PlaybackResponse {
  playbackId: string;
  titleAr: string;
  titleEn: string;
  status: string;
}

export default function WatchPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<PlaybackResponse | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied" | "error">("loading");

  useEffect(() => {
    if (authLoading) return;
    api<PlaybackResponse>(`/api/playback/${courseId}/${lessonId}`)
      .then((d) => {
        setData(d);
        setState("ok");
      })
      .catch((e: Error) => {
        setState(e.message === "not_entitled" ? "denied" : "error");
      });
  }, [authLoading, user, courseId, lessonId]);

  const title = data ? (lang === "ar" ? data.titleAr : data.titleEn) : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href={`/course/${courseId}`}
        className="text-sm font-semibold text-moss-600 hover:underline"
      >
        ← {t("backToCourse")}
      </Link>

      {state === "loading" && (
        <p className="py-24 text-center text-ink/50">{t("loading")}</p>
      )}

      {state === "denied" && (
        <div className="card mt-6 p-10 text-center">
          <p className="text-lg font-bold">🔒</p>
          <p className="mt-2 text-ink/70">{t("notEntitled")}</p>
          <Link href={`/course/${courseId}`} className="btn-primary mt-6">
            {t("backToCourse")}
          </Link>
        </div>
      )}

      {state === "error" && <p className="py-24 text-center text-ink/50">404</p>}

      {state === "ok" && data && (
        <div className="rise mt-6">
          <h1 className="mb-5 text-2xl font-bold">{title}</h1>
          {data.playbackId ? (
            <MuxPlayer
              playbackId={data.playbackId}
              streamType="on-demand"
              accentColor="#0B7A55"
              envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
              metadata={{ video_title: title }}
            />
          ) : (
            <p className="card p-10 text-center text-amber-600">{t("preparing")}</p>
          )}
        </div>
      )}
    </div>
  );
}
