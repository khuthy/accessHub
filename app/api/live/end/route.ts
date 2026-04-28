import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MODEL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { roomId } = await req.json();

  const room = await db.liveRoom.findFirst({
    where: { id: roomId, modelId: session.user.id },
  });
  if (!room) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.liveRoom.update({
    where: { id: roomId },
    data: { status: "ENDED", endedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
