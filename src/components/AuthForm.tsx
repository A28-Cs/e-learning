"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { api } from "@/lib/apiClient";
import { useLang } from "@/context/AppProviders";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useLang();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function register() {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
    // Teacher accounts stay pending until an admin approves them.
    if (intent === "teacher") {
      try {
        await api("/api/apply-teacher", { method: "POST" });
      } catch {
        /* non-fatal: they can re-apply later; account is created as a student */
      }
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await register();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch {
      setError(t("authFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card rise p-8">
        <h1 className="text-2xl font-bold">
          {mode === "login" ? t("loginTitle") : t("registerTitle")}
        </h1>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="label">{t("name")}</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          {mode === "register" && (
            <div>
              <label className="label">{t("registerAs")}</label>
              <div className="grid grid-cols-2 gap-2">
                {(["student", "teacher"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setIntent(r)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                      intent === r
                        ? "border-moss-500 bg-moss-500/10 text-moss-600"
                        : "border-ink/15 text-ink/60 hover:border-ink/30"
                    }`}
                  >
                    {r === "student" ? t("roleStudent") : t("roleTeacher")}
                  </button>
                ))}
              </div>
              {intent === "teacher" && (
                <p className="mt-1.5 text-xs text-ink/50">{t("teacherApprovalNote")}</p>
              )}
            </div>
          )}
          <div>
            <label className="label">{t("email")}</label>
            <input
              className="input"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">{t("password")}</label>
            <input
              className="input"
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? t("loading") : mode === "login" ? t("login") : t("register")}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink/60">
          {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
          <Link
            href={mode === "login" ? "/register" : "/login"}
            className="font-bold text-moss-600 hover:underline"
          >
            {mode === "login" ? t("register") : t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
