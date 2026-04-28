import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const GIFTS: Record<string, { label: string; emoji: string; tokenCost: number }> = {
  rose:    { label: "Rose",    emoji: "🌹", tokenCost: 5   },
  heart:   { label: "Heart",   emoji: "💜", tokenCost: 10  },
  crown:   { label: "Crown",   emoji: "👑", tokenCost: 50  },
  diamond: { label: "Diamond", emoji: "💎", tokenCost: 100 },
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { roomId, giftType } = await req.json();
  if (!roomId || !giftType || !GIFTS[giftType]) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const gift = GIFTS[giftType];
  const room = await db.liveRoom.findUnique({ where: { id: roomId } });
  if (!room || room.status !== "LIVE") {
    return NextResponse.json({ error: "Room not live" }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    const wallet = await tx.fanWallet.findUnique({ where: { userId: session.user.id } });
    if (!wallet || wallet.balance < gift.tokenCost) throw new Error("Insufficient tokens");

    await tx.fanWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: gift.tokenCost } },
    });
    await tx.tokenTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -gift.tokenCost,
        type: "SPEND",
        note: `Sent ${gift.emoji} ${gift.label} in live room`,
      },
    });
    await tx.liveGift.create({
      data: {
        roomId,
        fanId: session.user.id,
        giftType,
        tokenCost: gift.tokenCost,
      },
    });
  });

  return NextResponse.json({ success: true, gift });
}
