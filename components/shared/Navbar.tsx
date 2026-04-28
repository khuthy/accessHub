"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LogOut, Coins } from "lucide-react";

interface NavbarProps {
  type: "model" | "fan";
}

export function Navbar({ type }: NavbarProps) {
  const { data: session } = useSession();

  const links =
    type === "model"
      ? [
          { href: "/model/dashboard", label: "Dashboard" },
          { href: "/model/content", label: "Content" },
          { href: "/model/upload", label: "Upload" },
          { href: "/model/live", label: "Go Live" },
          { href: "/model/profile", label: "Profile" },
        ]
      : [
          { href: "/fan/browse", label: "Browse" },
          { href: "/fan/dashboard", label: "Wallet" },
        ];

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold gradient-brand bg-clip-text text-transparent">
            AccessHub
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg transition"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {type === "fan" && (
            <Link
              href="/fan/dashboard"
              className="flex items-center gap-1.5 text-sm text-brand-400 font-medium"
            >
              <Coins className="w-4 h-4" />
              <span>Tokens</span>
            </Link>
          )}
          <span className="text-sm text-zinc-500 hidden sm:block">
            @{session?.user.username}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
