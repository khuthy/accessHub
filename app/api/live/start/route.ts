import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

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

    const zegoRoomId = randomUUID();

    const room = await db.liveRoom.create({
      data: {
        modelId: session.user.id,
        title,
        tokenCost: tokenCost ?? 20,
        muxStreamKey: zegoRoomId, // repurposed to store ZEGOCLOUD room ID
        muxPlaybackId: null,
        status: "LIVE",
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ roomId: zegoRoomId, dbRoomId: room.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[LIVE/START]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
