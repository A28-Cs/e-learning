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
import { useLang } from "@/context/AppProviders";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useLang();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
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
