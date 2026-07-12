import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "./firebaseAdmin";

const PAYMOB_BASE = "https://accept.paymob.com";

export function paymentsEnabled(): boolean {
  return Boolean(
    process.env.PAYMOB_SECRET_KEY &&
      process.env.PAYMOB_PUBLIC_KEY &&
      process.env.PAYMOB_PAYMENT_METHODS
  );
}

interface CheckoutArgs {
  orderId: string; // our Firestore order doc id (sent as special_reference)
  amountCents: number;
  itemName: string;
  email: string;
  name: string;
}

// Creates a Paymob "intention" and returns the hosted Unified Checkout URL.
export async function createPaymobCheckout(args: CheckoutArgs): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const methods = (process.env.PAYMOB_PAYMENT_METHODS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (Number.isFinite(Number(s)) ? Number(s) : s));

  const [firstName, ...rest] = (args.name || "Student").split(" ");

  const res = await fetch(`${PAYMOB_BASE}/v1/intention/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: args.amountCents,
      currency: "EGP",
      payment_methods: methods,
      items: [
        {
          name: args.itemName.slice(0, 50),
          amount: args.amountCents,
          description: "Course enrollment",
          quantity: 1,
        },
      ],
      billing_data: {
        first_name: firstName || "NA",
        last_name: rest.join(" ") || "NA",
        email: args.email || "na@na.com",
        phone_number: "+201000000000",
        country: "EG",
        city: "NA",
        street: "NA",
        building: "NA",
        floor: "NA",
        apartment: "NA",
      },
      special_reference: args.orderId,
      notification_url: `${siteUrl}/api/pay/webhook`,
      redirection_url: `${siteUrl}/payment-result`,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.client_secret) {
    console.error("Paymob intention failed:", data);
    throw new Error("paymob_intention_failed");
  }

  return `${PAYMOB_BASE}/unifiedcheckout/?publicKey=${process.env.PAYMOB_PUBLIC_KEY}&clientSecret=${data.client_secret}`;
}

// Paymob signs callbacks with HMAC-SHA512 over these fields, in this exact order.
const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success",
] as const;

function asString(v: unknown): string {
  if (v === true) return "true";
  if (v === false) return "false";
  if (v === null || v === undefined) return "";
  return String(v);
}

function computeHmac(values: string[]): string {
  const secret = process.env.PAYMOB_HMAC_SECRET ?? "";
  return crypto.createHmac("sha512", secret).update(values.join("")).digest("hex");
}

// Verify the webhook payload (nested transaction object).
export function verifyWebhookHmac(obj: Record<string, unknown>, hmac: string): boolean {
  const order = obj.order as Record<string, unknown> | undefined;
  const sd = obj.source_data as Record<string, unknown> | undefined;
  const values = HMAC_FIELDS.map((f) => {
    if (f === "order") return asString(order?.id);
    if (f.startsWith("source_data.")) return asString(sd?.[f.split(".")[1]]);
    return asString(obj[f]);
  });
  return safeEqual(computeHmac(values), hmac);
}

// Verify the browser redirect query params (flat keys, dots preserved).
export function verifyRedirectHmac(params: Record<string, string>, hmac: string): boolean {
  const values = HMAC_FIELDS.map((f) => asString(params[f]));
  return safeEqual(computeHmac(values), hmac);
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// Idempotently mark an order paid and enroll the student.
export async function fulfillOrder(
  orderId: string,
  paymobTransactionId: string
): Promise<boolean> {
  const orderRef = adminDb.collection("orders").doc(orderId);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef);
    if (!snap.exists) return false;
    const order = snap.data()!;
    if (order.status === "paid") return true; // already fulfilled
    tx.update(orderRef, {
      status: "paid",
      paymobTransactionId,
      paidAt: Date.now(),
    });
    tx.set(
      adminDb.collection("users").doc(order.uid as string),
      { enrolledCourses: FieldValue.arrayUnion(order.courseId) },
      { merge: true }
    );
    return true;
  });
}
