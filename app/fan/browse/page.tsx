import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";
import { Coins, Radio } from "lucide-react";

export const revalidate = 60;

export default async function BrowsePage() {
  const models = await db.modelProfile.findMany({
    include: {
      user: {
        select: {
          username: true,
          posts: {
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { previewUrl: true },
          },
          liveRooms: {
            where: { status: "LIVE" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
    orderBy: { displayName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">Browse Creators</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          {models.length} creator{models.length !== 1 ? "s" : ""} on AccessHub
        </p>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          No creators yet. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {models.map((model) => {
            const isLive = model.user.liveRooms.length > 0;
            const preview = model.user.posts[0]?.previewUrl;

            return (
              <Link
                key={model.id}
                href={`/fan/${model.slug}`}
                className="group block bg-zinc-900 border border-zinc-800 hover:border-brand-500 rounded-xl overflow-hidden transition"
              >
                {/* Banner / preview */}
                <div className="relative aspect-[4/3] bg-zinc-800">
                  {preview ? (
                    <img
                      src={preview}
                      alt={model.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-900 to-zinc-900" />
                  )}
                  {isLive && (
                    <span className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      <Radio className="w-3 h-3" /> LIVE
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-1">
                  {model.avatarUrl ? (
                    <img
                      src={model.avatarUrl}
                      alt=""
                      className="w-10 h-10 rounded-full border-2 border-brand-500 -mt-7 mb-1"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full border-2 border-brand-500 -mt-7 mb-1 bg-brand-900 flex items-center justify-center text-brand-300 font-bold text-sm">
                      {model.displayName[0].toUpperCase()}
                    </div>
                  )}

                  <p className="font-semibold text-zinc-100 text-sm group-hover:text-brand-400 transition truncate">
                    {model.displayName}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">@{model.user.username}</p>
                  <div className="flex items-center gap-1 text-xs text-brand-400 font-medium">
                    <Coins className="w-3 h-3" />
                    {model.tokenPrice} tokens to unlock
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
