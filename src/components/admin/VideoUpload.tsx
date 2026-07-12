"use client";

import { useRef, useState } from "react";
import * as UpChunk from "@mux/upchunk";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";

export interface UploadedVideo {
  assetId: string;
  playbackId: string;
  duration: number;
}

type Phase = "idle" | "uploading" | "processing" | "ready" | "error";

// Full MUX direct-upload flow:
// 1) ask our API for a direct-upload URL
// 2) chunk-upload the file straight to MUX from the browser
// 3) poll our API until the asset is ready, then hand back playback ID
export default function VideoUpload({
  onReady,
}: {
  onReady: (video: UploadedVideo) => void;
}) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function pollUntilReady(uploadId: string) {
    setPhase("processing");
    for (let i = 0; i < 200; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const res = await api<{
        status: string;
        assetId?: string;
        playbackId?: string;
        duration?: number;
      }>(`/api/mux/upload/${uploadId}`);
      if (res.status === "ready" && res.playbackId) {
        setPhase("ready");
        onReady({
          assetId: res.assetId ?? "",
          playbackId: res.playbackId,
          duration: res.duration ?? 0,
        });
        return;
      }
      if (res.status === "errored") {
        throw new Error("MUX failed to process the video");
      }
    }
    throw new Error("Timed out waiting for MUX");
  }

  async function start(file: File) {
    setError("");
    setFileName(file.name);
    setPhase("uploading");
    setProgress(0);
    try {
      const { uploadId, url } = await api<{ uploadId: string; url: string }>(
        "/api/mux/upload",
        { method: "POST", body: {} }
      );

      const upload = UpChunk.createUpload({
        endpoint: url,
        file,
        chunkSize: 5120, // 5MB chunks
      });

      upload.on("progress", (e) => setProgress(Math.round(e.detail)));
      upload.on("error", (e) => {
        setError(String(e.detail));
        setPhase("error");
      });
      upload.on("success", () => {
        pollUntilReady(uploadId).catch((err: Error) => {
          setError(err.message);
          setPhase("error");
        });
      });
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) start(f);
        }}
      />

      {phase === "idle" || phase === "error" ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-ghost w-full border-dashed !py-6"
        >
          🎬 {t("uploadVideo")}
        </button>
      ) : (
        <div className="rounded-xl border border-ink/15 bg-white p-4">
          <p className="truncate text-xs font-semibold text-ink/60" dir="ltr">
            {fileName}
          </p>
          {phase === "uploading" && (
            <>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-moss-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-moss-600" dir="ltr">
                {t("uploading")} {progress}%
              </p>
            </>
          )}
          {phase === "processing" && (
            <p className="mt-3 animate-pulse text-sm font-bold text-amber-600">
              ⚙ {t("processingVideo")}
            </p>
          )}
          {phase === "ready" && (
            <p className="mt-3 text-sm font-bold text-moss-600">✓ {t("videoReady")}</p>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
