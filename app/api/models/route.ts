import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const models = await db.modelProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          username: true,
          posts: {
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { previewUrl: true, title: true },
          },
        },
      },
    },
    orderBy: { displayName: "asc" },
  });

  return NextResponse.json(models);
}
