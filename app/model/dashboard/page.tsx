import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Upload, Radio, BarChart3, Star } from "lucide-react";

export default async function ModelDashboard() {
  const session = await auth();
  if (!session || session.user.role !== "MODEL") redirect("/login");

  const [postCount, totalUnlocks, liveRoom] = await Promise.all([
    db.post.count({ where: { modelId: session.user.id, isPublished: true } }),
    db.contentUnlock.count({ where: { post: { modelId: session.user.id } } }),
    db.liveRoom.findFirst({
      where: { modelId: session.user.id, status: "LIVE" },
    }),
  ]);

  const profile = await db.modelProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">
          Welcome back, {profile?.displayName ?? session.user.username}
        </h1>
        <p className="text-zinc-400 mt-1">Here&apos;s an overview of your channel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Upload className="w-5 h-5" />} label="Published posts" value={postCount} />
        <StatCard icon={<Star className="w-5 h-5" />} label="Total unlocks" value={totalUnlocks} />
        <StatCard
          icon={<Radio className="w-5 h-5" />}
          label="Status"
          value={liveRoom ? "LIVE" : "Offline"}
          accent={!!liveRoom}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionCard href="/model/upload" icon={<Upload className="w-5 h-5" />} label="Upload content" />
          <ActionCard href="/model/live" icon={<Radio className="w-5 h-5" />} label="Go live" />
          <ActionCard href="/model/content" icon={<BarChart3 className="w-5 h-5" />} label="Manage posts" />
          <ActionCard href="/model/profile" icon={<Star className="w-5 h-5" />} label="Edit profile" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
      <div className={`${accent ? "text-brand-400" : "text-zinc-400"}`}>{icon}</div>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-brand-400" : "text-zinc-50"}`}>
        {value}
      </p>
    </div>
  );
}

function ActionCard({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-brand-500 hover:bg-zinc-800 transition text-zinc-300 hover:text-brand-400"
    >
      {icon}
      <span className="text-sm font-medium text-center">{label}</span>
    </Link>
  );
}
