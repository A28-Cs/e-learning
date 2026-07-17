import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse, requireUser } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

// PUT /api/profile — the caller updates their own editable profile fields.
// Username is a unique handle enforced through the `usernames` collection.
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const body = await req.json();
    const userRef = adminDb.collection("users").doc(user.uid);

    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = String(body.name).trim().slice(0, 80);
    if (body.bio !== undefined) patch.bio = String(body.bio).slice(0, 500);
    if (body.photoURL !== undefined) patch.photoURL = String(body.photoURL);
    if (body.phone !== undefined) patch.phone = String(body.phone).trim().slice(0, 25);

    // Username change needs a uniqueness reservation.
    if (body.username !== undefined) {
      const username = String(body.username).trim().toLowerCase();
      if (username && !USERNAME_RE.test(username)) {
        return Response.json({ error: "invalid_username" }, { status: 400 });
      }
      await adminDb.runTransaction(async (tx) => {
        const meSnap = await tx.get(userRef);
        const current = (meSnap.data()?.username as string | undefined) ?? null;
        if (username === (current ?? "")) return; // no change

        if (username) {
          const takenRef = adminDb.collection("usernames").doc(username);
          const takenSnap = await tx.get(takenRef);
          if (takenSnap.exists && takenSnap.data()!.uid !== user.uid) {
            throw new UsernameTaken();
          }
          tx.set(takenRef, { uid: user.uid });
        }
        if (current) tx.delete(adminDb.collection("usernames").doc(current));
        tx.set(userRef, { username: username || null }, { merge: true });
      });
    }

    if (Object.keys(patch).length > 0) {
      await userRef.set(patch, { merge: true });
    }
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof UsernameTaken) {
      return Response.json({ error: "username_taken" }, { status: 409 });
    }
    return errorResponse(err);
  }
}

class UsernameTaken extends Error {}
