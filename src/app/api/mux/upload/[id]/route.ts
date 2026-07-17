import { NextRequest } from "next/server";
import { mux } from "@/lib/mux";
import { errorResponse, requireRole } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// GET /api/mux/upload/[id] — poll upload/asset status until playback ID is ready
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(req, ["teacher"]);
    const upload = await mux.video.uploads.retrieve(params.id);

    if (!upload.asset_id) {
      return Response.json({ status: upload.status === "errored" ? "errored" : "waiting" });
    }

    const asset = await mux.video.assets.retrieve(upload.asset_id);
    if (asset.status === "ready") {
      return Response.json({
        status: "ready",
        assetId: asset.id,
        playbackId: asset.playback_ids?.[0]?.id ?? "",
        duration: Math.round(asset.duration ?? 0),
      });
    }
    if (asset.status === "errored") {
      return Response.json({ status: "errored" });
    }
    return Response.json({ status: "processing", assetId: asset.id });
  } catch (err) {
    return errorResponse(err);
  }
}
