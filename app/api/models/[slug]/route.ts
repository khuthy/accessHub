import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();

  const profile = await db.modelProfile.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          posts: {
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              title: true,
              description: true,
              previewUrl: true,
              mediaType: true,
              tokenCost: true,
              createdAt: true,
              // Never return mediaUrl here; fetched per-post via /api/content/[id]
            },
          },
          liveRooms: {
            where: { status: "LIVE" },
            take: 1,
            select: { id: true, title: true, tokenCost: true, muxPlaybackId: true },
          },
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Attach unlock status per post for the current fan
  let unlockedPostIds: Set<string> = new Set();
  if (session && session.user.role === "FAN") {
    const unlocks = await db.contentUnlock.findMany({
      where: { fanId: session.user.id, postId: { in: profile.user.posts.map((p) => p.id) } },
      select: { postId: true },
    });
    unlockedPostIds = new Set(unlocks.map((u) => u.postId));
  }

  const postsWithUnlockStatus = profile.user.posts.map((post) => ({
    ...post,
    isUnlocked:
      session?.user.id === profile.userId || unlockedPostIds.has(post.id),
  }));

  return NextResponse.json({
    ...profile,
    user: { ...profile.user, posts: postsWithUnlockStatus },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  if (!session || session.user.role !== "MODEL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await db.modelProfile.findUnique({ where: { slug } });
  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updated = await db.modelProfile.update({ where: { slug }, data: body });
  return NextResponse.json(updated);
}
