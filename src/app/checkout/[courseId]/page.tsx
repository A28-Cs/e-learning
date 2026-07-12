"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import ImageUpload from "@/components/admin/ImageUpload";
import { InstaPayLogo, VodafoneLogo } from "@/components/PayLogos";
import type { Course, PaymentRequest, PaymentSettings } from "@/lib/types";

type Method = "vodafone_cash" | "instapay";

export default function CheckoutPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { t, lang } = useLang();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [mine, setMine] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const [method, setMethod] = useState<Method>("vodafone_cash");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    Promise.all([
      api<{ course: Course; enrolled: boolean }>(`/api/courses/${courseId}`),
      fetch("/api/settings/payment").then((r) => r.json()),
      api<PaymentRequest | null>(`/api/payment-requests/mine?courseId=${courseId}`),
    ])
      .then(([c, s, m]) => {
        setCourse(c.course);
        setEnrolled(c.enrolled);
        setSettings(s);
        setMine(m);
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [authLoading, user, courseId, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/payment-requests", {
        method: "POST",
        body: { courseId, method, receiptUrl },
      });
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function copyNumber(value: string) {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading || authLoading) {
    return <p className="py-24 text-center text-ink/50">{t("loading")}</p>;
  }
  if (!course || !settings?.enabled) {
    return <p className="py-24 text-center text-ink/50">404</p>;
  }

  const title = lang === "ar" ? course.titleAr : course.titleEn;
  const price = `${course.price.toLocaleString()} ${t("egp")}`;

  const allMethods: { id: Method; label: string; logo: React.ReactNode; dest: string }[] = [
    {
      id: "vodafone_cash",
      label: t("vodafoneCash"),
      logo: <VodafoneLogo className="h-11 w-11" />,
      dest: settings.vodafoneCash,
    },
    {
      id: "instapay",
      label: t("instapay"),
      logo: <InstaPayLogo className="h-11 w-11" />,
      dest: settings.instapay,
    },
  ];
  const methods = allMethods.filter((m) => m.dest);

  const selected = methods.find((m) => m.id === method) ?? methods[0];

  /* -------- terminal states -------- */
  const centerCard = (inner: React.ReactNode) => (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="card rise p-10">{inner}</div>
    </div>
  );

  if (enrolled) {
    return centerCard(
      <>
        <p className="text-5xl">✓</p>
        <h1 className="mt-4 text-2xl font-extrabold text-moss-600">{t("enrolled")}</h1>
        <Link href={`/course/${courseId}`} className="btn-primary mt-8 w-full">
          {t("goToCourse")}
        </Link>
      </>
    );
  }

  if (submitted || mine?.status === "pending") {
    return centerCard(
      <>
        <p className="text-5xl">🧾</p>
        <h1 className="mt-4 text-2xl font-extrabold text-moss-600">{t("submittedTitle")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">{t("paymentPending")}</p>
        <Link href={`/course/${courseId}`} className="btn-ghost mt-8 w-full">
          {t("backToCourse")}
        </Link>
      </>
    );
  }

  /* -------- main checkout -------- */
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href={`/course/${courseId}`}
        className="text-sm font-semibold text-moss-600 hover:underline"
      >
        ← {t("backToCourse")}
      </Link>
      <h1 className="rise mt-3 text-3xl font-extrabold">{t("checkoutTitle")}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* ---- payment flow ---- */}
        <div className="rise space-y-6" style={{ animationDelay: "80ms" }}>
          {mine?.status === "rejected" && (
            <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700">
              {t("paymentRejected")}
              {mine.adminNote && (
                <>
                  {" "}
                  <span className="font-semibold">{t("rejectionReason")}:</span> {mine.adminNote}
                </>
              )}
            </div>
          )}

          {/* Step 1 — method + destination */}
          <section className="card p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-moss-500 font-display text-sm font-bold text-white">
                1
              </span>
              <h2 className="font-bold">{t("chooseMethod")}</h2>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-start transition-all ${
                    method === m.id
                      ? "border-moss-500 bg-moss-500/5 shadow-lift"
                      : "border-ink/10 bg-white hover:border-ink/30"
                  }`}
                >
                  {m.logo}
                  <div>
                    <p className="font-bold">{m.label}</p>
                    <p className="text-xs text-ink/50" dir="ltr">
                      {m.dest}
                    </p>
                  </div>
                  <span
                    className={`ms-auto grid h-5 w-5 place-items-center rounded-full border-2 text-[10px] font-bold ${
                      method === m.id
                        ? "border-moss-500 bg-moss-500 text-white"
                        : "border-ink/20 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-5 text-sm text-ink/60">{t("checkoutStep1")}</p>
            <div className="mt-2 flex items-center gap-2">
              <p
                className="flex-1 rounded-xl bg-ink px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-paper"
                dir="ltr"
              >
                {selected?.dest}
              </p>
              <button
                type="button"
                onClick={() => selected && copyNumber(selected.dest)}
                className="btn-ghost !px-4 !py-3 text-xs"
              >
                {copied ? t("copied") : t("copy")}
              </button>
            </div>
          </section>

          {/* Step 2 — proof of transfer */}
          <form onSubmit={submit} className="card space-y-6 p-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-moss-500 font-display text-sm font-bold text-white">
                  2
                </span>
                <h2 className="font-bold">{t("checkoutStep3")}</h2>
              </div>
              <div className="mt-4 max-w-sm">
                <ImageUpload value={receiptUrl} onChange={setReceiptUrl} />
              </div>
            </div>

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            <button
              className="btn-primary w-full !py-3.5 !text-base"
              disabled={busy || !receiptUrl}
            >
              {busy ? t("loading") : t("submitPaymentRequest")}
            </button>
            <p className="text-center text-xs leading-relaxed text-ink/50">{t("checkoutNote")}</p>
          </form>
        </div>

        {/* ---- order summary ---- */}
        <aside className="rise" style={{ animationDelay: "160ms" }}>
          <div className="card sticky top-24 overflow-hidden">
            <div className="relative aspect-video bg-moss-100">
              {course.thumbnail && (
                <Image src={course.thumbnail} alt={title} fill className="object-cover" sizes="340px" />
              )}
            </div>
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-ink/45">
                {t("orderSummary")}
              </p>
              <h3 className="mt-2 font-display text-lg font-bold leading-snug">{title}</h3>
              <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
                <span className="text-sm font-semibold text-ink/60">{t("total")}</span>
                <span className="font-display text-2xl font-extrabold text-moss-600">{price}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
