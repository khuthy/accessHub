import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { signupSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, username, password, role } = parsed.data;

    const existing = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email or username already taken" },
        { status: 409 }
      );
    }

    const hashed = await hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        username,
        password: hashed,
        role,
        ...(role === "FAN" && {
          wallet: {
            create: {
              balance: 100,
              transactions: {
                create: {
                  amount: 100,
                  type: "PURCHASE",
                  note: "Welcome bonus tokens",
                },
              },
            },
          },
        }),
        ...(role === "MODEL" && {
          profile: {
            create: {
              displayName: username,
              slug: slugify(username),
            },
          },
        }),
      },
    });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (err) {
    console.error("[SIGNUP]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
