"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Coins, Lock, Radio, Play, X } from "lucide-react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  description: string | null;
  previewUrl: string | null;
  mediaUrl: string | null;
  mediaType: string;
  tokenCost: number;
  isUnlocked: boolean;
  createdAt: string;
}

interface ModelPage {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  tokenPrice: number;
  slug: string;
  user: {
    id: string;
    username: string;
    posts: Post[];
    liveRooms: { id: string; title: string; tokenCost: number; muxStreamKey: string | null }[];
  };
}

export default function ModelPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [model, setModel] = useState<ModelPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  const [viewing, setViewing] = useState<Post | null>(null);

  useEffect(() => {
    fetch(`/api/models/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setModel(data);
        setLoading(false);
      });
  }, [slug]);

  async function unlock(postId: string) {
    setUnlocking(postId);
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError((e) => ({ ...e, [postId]: data.error || "Failed to unlock" }));
    } else {
      setModel((m) =>
        m
          ? {
              ...m,
              user: {
                ...m.user,
                posts: m.user.posts.map((p) =>
                  p.id === postId
                    ? { ...p, isUnlocked: true, mediaUrl: data.mediaUrl }
                    : p
                ),
              },
            }
          : m
      );
    }
    setUnlocking(null);
  }

  if (loading) return <div className="text-zinc-400 text-center py-20">Loading…</div>;
  if (!model) return <div className="text-zinc-400 text-center py-20">Creator not found.</div>;

  const liveRoom = model.user.liveRooms[0];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Lightbox */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <button
            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            onClick={() => setViewing(null)}
          >
            <X className="w-7 h-7" />
          </button>
          <div
            className="max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {viewing.mediaType === "VIDEO" ? (
              <VideoPlayer src={viewing.mediaUrl!} />
            ) : (
              <img
                src={viewing.mediaUrl!}
                alt={viewing.title}
                className="w-full rounded-xl max-h-[85vh] object-contain"
              />
            )}
            <p className="mt-3 text-zinc-200 font-medium text-center">{viewing.title}</p>
            {viewing.description && (
              <p className="mt-1 text-zinc-400 text-sm text-center">{viewing.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="relative">
        <div className="h-48 rounded-xl overflow-hidden bg-gradient-to-br from-brand-900 to-zinc-900">
          {model.bannerUrl && (
            <img src={model.bannerUrl} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="px-4 -mt-10 flex items-end gap-4">
          <div className="w-20 h-20 rounded-full border-4 border-zinc-950 bg-brand-900 overflow-hidden flex-shrink-0">
            {model.avatarUrl ? (
              <img src={model.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-2xl font-bold text-brand-300">
                {model.displayName[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="pb-2">
            <h1 className="text-2xl font-bold text-zinc-50">{model.displayName}</h1>
            <p className="text-sm text-zinc-400">@{model.user.username}</p>
          </div>
        </div>

        {model.bio && (
          <p className="mt-4 px-4 text-zinc-300 text-sm leading-relaxed">{model.bio}</p>
        )}
      </div>

      {/* Live room banner */}
      {liveRoom && liveRoom.muxStreamKey && (
        <Link
          href={`/fan/live/${liveRoom.muxStreamKey}`}
          className="flex items-center justify-between p-4 bg-red-950/20 border border-red-900 rounded-xl hover:bg-red-950/40 transition"
        >
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <div>
              <p className="font-semibold text-zinc-50">{liveRoom.title}</p>
              <p className="text-sm text-zinc-400">Live now — tap to watch</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-brand-400">
            <Coins className="w-4 h-4" />
            {liveRoom.tokenCost} tokens
          </div>
        </Link>
      )}

      {/* Content grid */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-4">
          Posts ({model.user.posts.length})
        </h2>

        {model.user.posts.length === 0 ? (
          <p className="text-zinc-500 text-sm">No posts yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {model.user.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUnlock={() => unlock(post.id)}
                onView={() => setViewing(post)}
                unlocking={unlocking === post.id}
                unlockError={error[post.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoPlayer({ src }: { src: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="w-full rounded-xl bg-zinc-900 border border-zinc-700 p-6 text-center space-y-3">
        <p className="text-red-400 font-semibold">Video could not be played</p>
        <p className="text-zinc-400 text-sm">
          This URL is not a direct video file. The <code className="text-brand-400">&lt;video&gt;</code> tag
          only supports direct links ending in <code className="text-zinc-300">.mp4</code> or{" "}
          <code className="text-zinc-300">.webm</code>.
        </p>
        <p className="text-zinc-500 text-xs">
          Upload your video to{" "}
          <a href="https://cloudinary.com" target="_blank" className="text-brand-400 underline">
            Cloudinary
          </a>{" "}
          or{" "}
          <a href="https://bunny.net" target="_blank" className="text-brand-400 underline">
            Bunny.net
          </a>{" "}
          and paste the direct <code>.mp4</code> link.
        </p>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm rounded-lg transition"
        >
          Open original link ↗
        </a>
      </div>
    );
  }

  return (
    <video
      src={src}
      controls
      autoPlay
      className="w-full rounded-xl max-h-[80vh]"
      onError={() => setErrored(true)}
    />
  );
}

function PostCard({
  post,
  onUnlock,
  onView,
  unlocking,
  unlockError,
}: {
  post: Post;
  onUnlock: () => void;
  onView: () => void;
  unlocking: boolean;
  unlockError?: string;
}) {
  const isLocked = !post.isUnlocked && post.tokenCost > 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="relative aspect-square bg-zinc-800">
        {/* Always show preview thumbnail */}
        {post.previewUrl ? (
          <img src={post.previewUrl} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-zinc-600" />
          </div>
        )}

        {/* Locked overlay */}
        {isLocked && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <Lock className="w-6 h-6 text-brand-400" />
            <span className="flex items-center gap-1 text-sm font-semibold text-brand-300">
              <Coins className="w-4 h-4" /> {post.tokenCost}
            </span>
            <button
              onClick={onUnlock}
              disabled={unlocking}
              className="mt-1 px-4 py-1.5 gradient-brand text-white text-xs font-bold rounded-full hover:opacity-90 disabled:opacity-50 transition"
            >
              {unlocking ? "Unlocking…" : "Unlock"}
            </button>
          </div>
        )}

        {/* Unlocked — click to view full content */}
        {post.isUnlocked && post.mediaUrl && (
          <button
            onClick={onView}
            className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition"
          >
            <span className="px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white text-sm font-semibold">
              View
            </span>
          </button>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-medium text-zinc-100 truncate">{post.title}</p>
        {unlockError && (
          <p className="text-xs text-red-400 mt-1">{unlockError}</p>
        )}
        {post.isUnlocked && (
          <p className="text-xs text-green-400 mt-1">
            {post.mediaUrl ? "Unlocked — click to view" : "Unlocked ✓"}
          </p>
        )}
      </div>
    </div>
  );
}
