import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { postSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MODEL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const post = await db.post.create({
    data: {
      ...parsed.data,
      modelId: session.user.id,
      previewUrl: parsed.data.previewUrl || null,
      mediaUrl: parsed.data.mediaUrl || null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "MODEL") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const posts = await db.post.findMany({
    where: { modelId: session.user.id },
    include: { _count: { select: { unlocks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(posts);
}
