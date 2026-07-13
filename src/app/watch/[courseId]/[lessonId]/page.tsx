"use client";

import { useEffect, useRef, useState } from "react";
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

// watermark drifts between these spots so it can't be cropped out
const WM_SPOTS = [
  { top: "8%", insetInlineStart: "6%" },
  { top: "12%", insetInlineStart: "62%" },
  { top: "78%", insetInlineStart: "10%" },
  { top: "70%", insetInlineStart: "58%" },
  { top: "45%", insetInlineStart: "35%" },
];

export default function WatchPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<PlaybackResponse | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied" | "error">("loading");
  const [wmIndex, setWmIndex] = useState(0);
  const [flash, setFlash] = useState(false);
  const lastReport = useRef(0);

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

  // drifting watermark
  useEffect(() => {
    const timer = setInterval(() => setWmIndex((i) => (i + 1) % WM_SPOTS.length), 6000);
    return () => clearInterval(timer);
  }, []);

  // capture deterrence + detection (best effort — the browser can only see
  // key events and its own context; OS-level capture is invisible to web pages)
  useEffect(() => {
    if (state !== "ok") return;

    function report(type: "screenshot" | "record") {
      const now = Date.now();
      if (now - lastReport.current < 10_000) return; // throttle
      lastReport.current = now;
      api("/api/security-events", {
        method: "POST",
        body: { type, courseId, lessonId },
      }).catch(() => {});
    }

    function trigger(type: "screenshot" | "record") {
      setFlash(true);
      setTimeout(() => setFlash(false), 2500);
      report(type);
    }

    function onKey(e: KeyboardEvent) {
      // Windows PrintScreen (fires on keyup) — also try to poison the clipboard
      if (e.key === "PrintScreen") {
        try {
          navigator.clipboard.writeText("");
        } catch {
          /* clipboard may be unavailable */
        }
        trigger("screenshot");
        return;
      }
      // macOS capture combos
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        trigger(e.key === "5" ? "record" : "screenshot");
      }
    }

    function onCtx(e: MouseEvent) {
      e.preventDefault();
    }

    window.addEventListener("keyup", onKey);
    window.addEventListener("keydown", onKey);
    document.addEventListener("contextmenu", onCtx);
    return () => {
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("contextmenu", onCtx);
    };
  }, [state, courseId, lessonId]);

  const title = data ? (lang === "ar" ? data.titleAr : data.titleEn) : "";

  return (
    <div className="mx-auto max-w-4xl select-none px-4 py-10">
      {/* blackout overlay when a capture attempt is detected */}
      {flash && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-ink px-6 text-center">
          <p className="max-w-md text-lg font-bold text-white">🚫 {t("captureBlocked")}</p>
        </div>
      )}

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
            <div className="relative overflow-hidden rounded-2xl">
              <MuxPlayer
                playbackId={data.playbackId}
                streamType="on-demand"
                accentColor="#0B7A55"
                envKey={process.env.NEXT_PUBLIC_MUX_ENV_KEY}
                metadata={{
                  video_title: title,
                  viewer_user_id: user?.uid ?? "anonymous",
                }}
              />
              {/* drifting forensic watermark */}
              {user?.email && (
                <div
                  className="pointer-events-none absolute z-10 rounded-md bg-ink/25 px-2.5 py-1 text-[11px] font-semibold text-white/70 backdrop-blur-[2px] transition-all duration-1000"
                  style={WM_SPOTS[wmIndex]}
                  dir="ltr"
                >
                  {t("protectedFor")}: {user.email}
                </div>
              )}
            </div>
          ) : (
            <p className="card p-10 text-center text-amber-600">{t("preparing")}</p>
          )}
        </div>
      )}
    </div>
  );
}
