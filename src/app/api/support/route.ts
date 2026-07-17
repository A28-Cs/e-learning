import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, getStoredRole, requireUser } from "@/lib/serverAuth";
import type { SupportTicket } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/support — the caller's own tickets, or every ticket for an admin
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    let query: FirebaseFirestore.Query = adminDb.collection("supportTickets");
    if (!user.isAdmin) {
      query = query.where("uid", "==", user.uid);
    }
    const snap = await query.get();
    const rows = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as SupportTicket)
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    return Response.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}

// POST /api/support — open a new ticket with its first message
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const subject = String(body.subject ?? "").trim().slice(0, 150);
    const text = String(body.message ?? "").trim().slice(0, 4000);
    if (!subject || !text) {
      return Response.json({ error: "bad_request" }, { status: 400 });
    }

    const role = await getStoredRole(user.uid);
    const now = Date.now();
    const ref = adminDb.collection("supportTickets").doc();
    const ticket: Omit<SupportTicket, "id"> = {
      uid: user.uid,
      name: user.name,
      email: user.email,
      role,
      subject,
      status: "open",
      unreadByAdmin: true,
      messageCount: 1,
      lastMessageAt: now,
      createdAt: now,
    };
    await ref.set(ticket);
    await ref.collection("messages").add({
      senderUid: user.uid,
      senderName: user.name,
      isAdmin: false,
      text,
      createdAt: now,
    });

    return Response.json({ id: ref.id, ...ticket }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
