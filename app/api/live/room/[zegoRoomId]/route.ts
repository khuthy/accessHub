import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ zegoRoomId: string }> }
) {
  const { zegoRoomId } = await params;

  const room = await db.liveRoom.findFirst({
    where: { muxStreamKey: zegoRoomId, status: "LIVE" },
    select: { id: true, title: true, tokenCost: true, modelId: true },
  });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
  return NextResponse.json(room);
}
