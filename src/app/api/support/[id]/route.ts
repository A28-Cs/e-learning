import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, HttpError, requireUser } from "@/lib/serverAuth";
import type { SupportMessage, SupportTicket } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadTicket(id: string) {
  const ref = adminDb.collection("supportTickets").doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, "not_found");
  return { ref, ticket: { id: snap.id, ...(snap.data() as Omit<SupportTicket, "id">) } };
}

// GET /api/support/[id] — the ticket plus its full message thread (owner or admin)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    const { ref, ticket } = await loadTicket(params.id);
    if (!user.isAdmin && ticket.uid !== user.uid) {
      throw new HttpError(403, "Forbidden");
    }

    const msgSnap = await ref.collection("messages").orderBy("createdAt", "asc").get();
    const messages = msgSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as SupportMessage);

    // Viewing as admin clears the "needs attention" flag.
    if (user.isAdmin && ticket.unreadByAdmin) {
      await ref.update({ unreadByAdmin: false });
      ticket.unreadByAdmin = false;
    }

    return Response.json({ ticket, messages });
  } catch (err) {
    return errorResponse(err);
  }
}

// PUT /api/support/[id] — admin closes or reopens a ticket
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser(req);
    if (!user.isAdmin) throw new HttpError(403, "Forbidden");
    const { ref } = await loadTicket(params.id);
    const body = await req.json();
    const status = body.status === "closed" ? "closed" : "open";
    await ref.update({ status });
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
