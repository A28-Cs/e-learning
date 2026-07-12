"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth, useLang } from "@/context/AppProviders";

function ResultInner() {
  const { t } = useLang();
  const { refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"checking" | "paid" | "failed">("checking");
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => (params[k] = v));

    if (!params.hmac) {
      setState("failed");
      return;
    }

    fetch("/api/pay/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params }),
    })
      .then((r) => r.json())
      .then(async (d) => {
        if (d.status === "paid") {
          setCourseId(d.courseId ?? "");
          setState("paid");
          await refreshProfile();
        } else {
          setState("failed");
        }
      })
      .catch(() => setState("failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="card rise p-10">
        {state === "checking" && (
          <>
            <p className="animate-pulse text-4xl">⏳</p>
            <p className="mt-4 font-bold">{t("paymentChecking")}</p>
          </>
        )}
        {state === "paid" && (
          <>
            <p className="text-5xl">🎉</p>
            <h1 className="mt-4 text-2xl font-extrabold text-moss-600">
              {t("paymentSuccessTitle")}
            </h1>
            <Link
              href={courseId ? `/course/${courseId}` : "/my-courses"}
              className="btn-primary mt-8 w-full"
            >
              {t("goToCourse")}
            </Link>
          </>
        )}
        {state === "failed" && (
          <>
            <p className="text-5xl">😕</p>
            <h1 className="mt-4 text-2xl font-extrabold text-red-600">
              {t("paymentFailedTitle")}
            </h1>
            <p className="mt-2 text-sm text-ink/60">{t("paymentFailedMsg")}</p>
            <Link href="/" className="btn-ghost mt-8 w-full">
              {t("navHome")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultInner />
    </Suspense>
  );
}
