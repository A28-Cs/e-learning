"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "firebase/auth";
import { useLang } from "@/context/AppProviders";
import { api } from "@/lib/apiClient";
import { InstaPayLogo, VodafoneLogo } from "@/components/PayLogos";
import type { PaymentRequest, PaymentSettings } from "@/lib/types";

// "Pay now" entry point on the course page: links to /checkout/[courseId]
// when manual payments are enabled; shows a pending note if the student
// already has a request under review.
export default function CheckoutButton({
  courseId,
  user,
}: {
  courseId: string;
  user: User | null;
}) {
  const { t } = useLang();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [mine, setMine] = useState<PaymentRequest | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const jobs: Promise<void>[] = [
      fetch("/api/settings/payment")
        .then((r) => r.json())
        .then(setSettings)
        .catch(() => {}),
    ];
    if (user) {
      jobs.push(
        api<PaymentRequest | null>(`/api/payment-requests/mine?courseId=${courseId}`)
          .then(setMine)
          .catch(() => {})
      );
    }
    Promise.all(jobs).finally(() => setReady(true));
  }, [courseId, user]);

  if (!ready || !settings?.enabled) return null;

  if (mine?.status === "pending") {
    return (
      <p className="mt-4 rounded-xl bg-amber-500/10 px-4 py-3 text-center text-sm font-bold text-amber-600">
        {t("paymentPending")}
      </p>
    );
  }

  return (
    <>
      <Link
        href={user ? `/checkout/${courseId}` : "/login"}
        className="btn-primary mt-4 w-full !py-3.5 !text-base"
      >
        {t("payNow")}
      </Link>
      <div className="mt-3 flex items-center justify-center gap-2 opacity-90">
        <VodafoneLogo className="h-6 w-6" />
        <InstaPayLogo className="h-6 w-6" />
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-ink/40">
        <span className="h-px flex-1 bg-ink/10" />
        {t("orDivider")}
        <span className="h-px flex-1 bg-ink/10" />
      </div>
    </>
  );
}
