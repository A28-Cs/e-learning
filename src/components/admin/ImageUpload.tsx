"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useLang } from "@/context/AppProviders";

// Uploads directly to Cloudinary using the unsigned "e-learning" preset.
export default function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    try {
      const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", preset ?? "");
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
        { method: "POST", body: form }
      );
      const data = await res.json();
      if (!res.ok || !data.secure_url) {
        throw new Error(data?.error?.message ?? "Upload failed");
      }
      onChange(data.secure_url as string);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
        }}
      />
      <div
        onClick={() => !busy && inputRef.current?.click()}
        className="relative grid aspect-video cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-ink/20 bg-white transition-colors hover:border-moss-500"
      >
        {value ? (
          <>
            <Image src={value} alt="" fill className="object-cover" sizes="400px" />
            <span className="absolute bottom-2 end-2 rounded-lg bg-ink/75 px-3 py-1 text-xs font-bold text-white">
              {busy ? t("uploading") : t("changeImage")}
            </span>
          </>
        ) : (
          <span className="text-sm font-semibold text-ink/50">
            {busy ? t("uploading") : `🖼 ${t("uploadImage")}`}
          </span>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
