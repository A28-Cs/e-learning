import { NextRequest } from "next/server";
import { mux } from "@/lib/mux";
import { errorResponse, requireRole } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// POST /api/mux/upload — create a MUX direct-upload URL (teacher or admin)
export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ["teacher"]);
    const upload = await mux.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        playback_policy: ["public"],
        encoding_tier: "baseline",
      },
    });
    return Response.json({ uploadId: upload.id, url: upload.url });
  } catch (err) {
    return errorResponse(err);
  }
}
