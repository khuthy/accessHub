"use client";

import { useEffect, useState } from "react";

const GIFT_META: Record<string, { emoji: string; label: string; tokenCost: number }> = {
  rose:    { emoji: "🌹", label: "Rose",    tokenCost: 5   },
  heart:   { emoji: "💜", label: "Heart",   tokenCost: 10  },
  crown:   { emoji: "👑", label: "Crown",   tokenCost: 50  },
  diamond: { emoji: "💎", label: "Diamond", tokenCost: 100 },
};

interface Gift {
  id: string;
  giftType: string;
  tokenCost: number;
  createdAt: string;
  fan: { username: string };
}

interface GiftFeedProps {
  roomId: string;
  /** Show gift buttons (fan watch page) */
  canSend?: boolean;
  /** DB room ID for sending gifts */
  dbRoomId?: string;
}

export function GiftFeed({ roomId, canSend, dbRoomId }: GiftFeedProps) {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [floaters, setFloaters] = useState<{ id: string; emoji: string }[]>([]);

  // Poll for new gifts every 3 seconds
  useEffect(() => {
    function fetchGifts() {
      fetch(`/api/live/gifts/${roomId}`)
        .then((r) => r.json())
        .then((data: Gift[]) => {
          setGifts((prev) => {
            const newOnes = data.filter((g) => !prev.some((p) => p.id === g.id));
            if (newOnes.length > 0) {
              newOnes.forEach((g) => spawnFloater(GIFT_META[g.giftType]?.emoji ?? "🎁"));
            }
            return data;
          });
        })
        .catch(() => {});
    }
    fetchGifts();
    const interval = setInterval(fetchGifts, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  function spawnFloater(emoji: string) {
    const id = Math.random().toString(36).slice(2);
    setFloaters((f) => [...f, { id, emoji }]);
    setTimeout(() => setFloaters((f) => f.filter((x) => x.id !== id)), 2500);
  }

  async function sendGift(giftType: string) {
    if (!dbRoomId) return;
    setSending(giftType);
    setError("");
    const res = await fetch("/api/live/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: dbRoomId, giftType }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to send gift");
    setSending(null);
  }

  return (
    <div className="relative">
      {/* Floating gift animations */}
      <div className="pointer-events-none fixed bottom-32 right-6 flex flex-col-reverse gap-2 z-50">
        {floaters.map((f) => (
          <span
            key={f.id}
            className="text-4xl animate-bounce"
            style={{ animation: "floatUp 2.5s ease-out forwards" }}
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* Gift send buttons */}
      {canSend && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Send a gift</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(GIFT_META).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => sendGift(type)}
                disabled={sending === type}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-brand-500 rounded-full text-sm transition disabled:opacity-50"
              >
                <span className="text-base">{meta.emoji}</span>
                <span className="text-zinc-300 font-medium">{meta.label}</span>
                <span className="text-brand-400 font-bold">{meta.tokenCost}T</span>
              </button>
            ))}
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {/* Recent gifts feed */}
      {gifts.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {gifts.slice(0, 10).map((g) => {
            const meta = GIFT_META[g.giftType] ?? { emoji: "🎁", label: g.giftType };
            return (
              <div key={g.id} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{meta.emoji}</span>
                <span className="text-zinc-400">
                  <span className="text-zinc-200 font-medium">@{g.fan.username}</span>
                  {" sent "}
                  <span className="text-brand-400">{meta.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-120px) scale(1.4); }
        }
      `}</style>
    </div>
  );
}
