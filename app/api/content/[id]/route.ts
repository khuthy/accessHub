import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { postSchema } from "@/lib/validations";

async function getPostAndVerifyOwner(id: string, userId: string) {
  return db.post.findFirst({ where: { id, modelId: userId } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const post = await db.post.findUnique({
    where: { id },
    include: { model: { select: { username: true, profile: true } } },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Gate full mediaUrl: only return if requester has unlocked or is the model
  if (post.tokenCost > 0 && post.mediaUrl) {
    const isOwner = session?.user.id === post.modelId;
    const hasUnlocked =
      session &&
      (await db.contentUnlock.findUnique({
        where: { fanId_postId: { fanId: session.user.id, postId: id } },
      }));
    if (!isOwner && !hasUnlocked) {
      return NextResponse.json({ ...post, mediaUrl: null });
    }
  }

  return NextResponse.json(post);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "MODEL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const post = await getPostAndVerifyOwner(id, session.user.id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = postSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const updated = await db.post.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "MODEL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const post = await getPostAndVerifyOwner(id, session.user.id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
