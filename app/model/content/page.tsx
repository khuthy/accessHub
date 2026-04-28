"use client";

import { useEffect, useState } from "react";
import { Trash2, Eye, EyeOff, Coins, Lock } from "lucide-react";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  description: string;
  previewUrl: string | null;
  mediaType: string;
  tokenCost: number;
  isPublished: boolean;
  createdAt: string;
  _count: { unlocks: number };
}

export default function ContentPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, []);

  async function togglePublished(post: Post) {
    const res = await fetch(`/api/content/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !post.isPublished }),
    });
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, isPublished: !post.isPublished } : p
        )
      );
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  if (loading) {
    return <div className="text-zinc-400 text-center py-20">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">My Content</h1>
        <Link
          href="/model/upload"
          className="px-4 py-2 gradient-brand text-white text-sm font-semibold rounded-lg hover:opacity-90 transition"
        >
          + New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 text-zinc-500">
          No posts yet.{" "}
          <Link href="/model/upload" className="text-brand-400 hover:underline">
            Upload your first post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              {/* Thumbnail */}
              {post.previewUrl ? (
                <img
                  src={post.previewUrl}
                  alt={post.title}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-zinc-800 rounded-lg flex-shrink-0 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-zinc-600" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-100 truncate">{post.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3 h-3" /> {post.tokenCost} tokens
                  </span>
                  <span>{post._count.unlocks} unlocks</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    post.isPublished
                      ? "bg-green-950 text-green-400"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {post.isPublished ? "Published" : "Draft"}
                </span>
                <button
                  onClick={() => togglePublished(post)}
                  className="p-2 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded-lg transition"
                  title={post.isPublished ? "Unpublish" : "Publish"}
                >
                  {post.isPublished ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
