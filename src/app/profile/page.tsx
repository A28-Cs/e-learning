"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import ImageUpload from "@/components/admin/ImageUpload";

export default function ProfilePage() {
  const { t } = useLang();
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setUsername(profile.username ?? "");
    setBio(profile.bio ?? "");
    setPhone(profile.phone ?? "");
    setPhotoURL(profile.photoURL ?? "");
  }, [profile]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await api("/api/profile", {
        method: "PUT",
        body: { name, username: username.trim().toLowerCase(), bio, phone, photoURL },
      });
      await refreshProfile();
      setNotice(t("profileSaved"));
    } catch (err) {
      const msg = (err as Error).message;
      setError(
        msg === "username_taken"
          ? t("usernameTaken")
          : msg === "invalid_username"
            ? t("usernameInvalid")
            : msg
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading || !profile) {
    return <p className="py-24 text-center text-ink/50">{t("loading")}</p>;
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{t("profileTitle")}</h1>
        {profile.username && (
          <Link
            href={`/u/${profile.username}`}
            className="btn-ghost !px-3 !py-1.5 text-xs"
          >
            {t("viewPublicProfile")} ↗
          </Link>
        )}
      </div>

      <form onSubmit={save} className="card space-y-5 p-6">
        <div>
          <label className="label">{t("avatar")}</label>
          <div className="max-w-48">
            <ImageUpload value={photoURL} onChange={setPhotoURL} />
          </div>
        </div>

        <div>
          <label className="label">{t("displayName")}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className="label">{t("username")}</label>
          <div className="flex items-center gap-2">
            <span className="text-ink/40">@</span>
            <input
              className="input"
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
            />
          </div>
          <p className="mt-1 text-xs text-ink/45">{t("usernameHint")}</p>
          {!profile.username && (
            <p className="mt-1 text-xs text-amber-600">{t("setUsernamePrompt")}</p>
          )}
        </div>

        <div>
          <label className="label">{t("phone")}</label>
          <input
            className="input"
            type="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+20 1x xxxx xxxx"
          />
          <p className="mt-1 text-xs text-ink/45">{t("phoneHint")}</p>
        </div>

        <div>
          <label className="label">{t("bio")}</label>
          <textarea
            className="input min-h-24"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={busy}>
            {busy ? t("loading") : t("saveProfile")}
          </button>
          {notice && <span className="text-sm font-medium text-moss-600">{notice}</span>}
        </div>
      </form>
    </div>
  );
}
