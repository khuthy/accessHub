import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const role = session?.user.role;

  // Protect /model/* routes — MODEL only
  if (nextUrl.pathname.startsWith("/model")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "MODEL") {
      return NextResponse.redirect(new URL("/fan/browse", nextUrl));
    }
  }

  // Protect /fan/* routes — any authenticated user
  if (nextUrl.pathname.startsWith("/fan")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/signup")) {
    const dest = role === "MODEL" ? "/model/dashboard" : "/fan/browse";
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
