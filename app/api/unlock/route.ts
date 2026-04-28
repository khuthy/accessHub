import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "FAN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { postId } = await req.json();
  if (!postId) {
    return NextResponse.json({ error: "postId required" }, { status: 400 });
  }

  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post || !post.isPublished) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if already unlocked
  const existing = await db.contentUnlock.findUnique({
    where: { fanId_postId: { fanId: session.user.id, postId } },
  });
  if (existing) {
    return NextResponse.json({ mediaUrl: post.mediaUrl });
  }

  // Transactional: deduct tokens + create unlock record
  const result = await db.$transaction(async (tx) => {
    const wallet = await tx.fanWallet.findUnique({
      where: { userId: session.user.id },
    });
    if (!wallet || wallet.balance < post.tokenCost) {
      throw new Error("Insufficient tokens");
    }

    await tx.fanWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: post.tokenCost } },
    });

    await tx.tokenTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -post.tokenCost,
        type: "SPEND",
        note: `Unlocked: ${post.title}`,
      },
    });

    const unlock = await tx.contentUnlock.create({
      data: { fanId: session.user.id, postId },
    });

    return unlock;
  });

  return NextResponse.json({ success: true, unlock: result, mediaUrl: post.mediaUrl });
}
