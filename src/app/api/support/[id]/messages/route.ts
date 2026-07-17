import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireUser } from "@/lib/serverAuth";
import type { SupportTicket } from "@/lib/types";

export const dynamic = "force-dynamic";

// POST /api/support/[id]/messages — reply on a ticket (owner or admin).
// A user reply reopens a closed ticket; either side's message flips who
// the ball is in the court of via `unreadByAdmin`.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    const ref = adminDb.collection("supportTickets").doc(params.id);
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "not_found");
    const ticket = snap.data() as Omit<SupportTicket, "id">;
    if (!user.isAdmin && ticket.uid !== user.uid) {
      throw new HttpError(403, "Forbidden");
    }

    const body = await req.json();
    const text = String(body.text ?? "").trim().slice(0, 4000);
    if (!text) return Response.json({ error: "bad_request" }, { status: 400 });

    const now = Date.now();
    await ref.collection("messages").add({
      senderUid: user.uid,
      senderName: user.name,
      isAdmin: user.isAdmin,
      text,
      createdAt: now,
    });
    await ref.update({
      lastMessageAt: now,
      messageCount: (ticket.messageCount ?? 0) + 1,
      unreadByAdmin: !user.isAdmin,
      status: "open",
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
