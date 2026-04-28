import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "MODEL") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, tokenCost } = await req.json();
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // End any existing live rooms for this model
    await db.liveRoom.updateMany({
      where: { modelId: session.user.id, status: "LIVE" },
      data: { status: "ENDED", endedAt: new Date() },
    });

    // If Mux is not configured, create a placeholder stream for testing
    if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) {
      const room = await db.liveRoom.create({
        data: {
          modelId: session.user.id,
          title,
          tokenCost: tokenCost ?? 20,
          muxStreamKey: "test-stream-key-add-mux-credentials",
          muxPlaybackId: null,
          status: "LIVE",
          startedAt: new Date(),
        },
      });

      return NextResponse.json({
        roomId: room.id,
        streamKey: "test-stream-key-add-mux-credentials",
        rtmpUrl: "rtmps://global-live.mux.com:443/app",
        playbackId: null,
        warning: "Mux credentials not configured — stream key is a placeholder",
      });
    }

    // Lazy-import Mux so missing credentials don't crash the module at startup
    const { mux } = await import("@/lib/mux");

    const stream = await mux.video.liveStreams.create({
      playback_policy: ["public"],
      new_asset_settings: { playback_policy: ["public"] },
    });

    const room = await db.liveRoom.create({
      data: {
        modelId: session.user.id,
        title,
        tokenCost: tokenCost ?? 20,
        muxStreamKey: stream.stream_key,
        muxPlaybackId: stream.playback_ids?.[0]?.id ?? null,
        status: "LIVE",
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      roomId: room.id,
      streamKey: stream.stream_key,
      rtmpUrl: "rtmps://global-live.mux.com:443/app",
      playbackId: room.muxPlaybackId,
    });
  } catch (err) {
    console.error("[LIVE/START]", err);
    return NextResponse.json(
      { error: "Failed to start stream. Check server logs." },
      { status: 500 }
    );
  }
}
