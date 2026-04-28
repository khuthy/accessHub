import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const wallet = await db.fanWallet.findUnique({
    where: { userId: session.user.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!wallet) {
    return NextResponse.json({ balance: 0, transactions: [] });
  }

  return NextResponse.json({
    balance: wallet.balance,
    transactions: wallet.transactions,
  });
}
