import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;

  const gifts = await db.liveGift.findMany({
    where: { roomId },
    include: { fan: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(gifts);
}
