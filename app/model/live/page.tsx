"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Radio } from "lucide-react";
import { GiftFeed } from "@/components/live/GiftFeed";

interface StreamInfo {
  roomId: string;
  dbRoomId: string;
}

export default function LivePage() {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [tokenCost, setTokenCost] = useState(20);
  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startStream() {
    if (!title.trim()) { setError("Title is required"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/live/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, tokenCost }),
    });

    let data: Record<string, string> = {};
    try { data = await res.json(); } catch {
      setError("Server error"); setLoading(false); return;
    }

    if (!res.ok) {
      setError(data.error || "Failed to start stream");
    } else {
      setStream({ roomId: data.roomId, dbRoomId: data.dbRoomId });
    }
    setLoading(false);
  }

  async function endStream() {
    if (!stream) return;
    await fetch("/api/live/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: stream.dbRoomId }),
    });
    setStream(null);
    setTitle("");
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Radio className={`w-6 h-6 ${stream ? "text-red-500 animate-pulse" : "text-zinc-400"}`} />
        <h1 className="text-2xl font-bold text-zinc-50">
          {stream ? "You are LIVE" : "Go Live"}
        </h1>
      </div>

      {!stream ? (
        <div className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Stream title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tonight's show…"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Token cost to watch</label>
            <input
              type="number" min={0} max={9999} value={tokenCost}
              onChange={(e) => setTokenCost(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">{error}</p>
          )}
          <button
            onClick={startStream} disabled={loading}
            className="w-full py-2.5 gradient-brand text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4" />
            {loading ? "Starting…" : "Start stream"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <ZegoHost
            roomId={stream.roomId}
            userId={session?.user.id ?? "host"}
            userName={session?.user.username ?? "Host"}
          />
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <GiftFeed roomId={stream.roomId} />
          </div>
          <button
            onClick={endStream}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
          >
            End stream
          </button>
        </div>
      )}
    </div>
  );
}

function ZegoHost({ roomId, userId, userName }: { roomId: string; userId: string; userName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const appID = Number(process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET!;
    if (!appID || !serverSecret) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let zp: any = null;

    import("@zegocloud/zego-uikit-prebuilt").then(({ ZegoUIKitPrebuilt }) => {
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, serverSecret, roomId, userId, userName
      );
      zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: { role: ZegoUIKitPrebuilt.Host },
        },
        showLeaveRoomConfirmDialog: false,
        showRoomDetailsButton: false,
      });
    });

    return () => { zp?.destroy(); };
  }, [roomId, userId, userName]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-zinc-800"
      style={{ height: 560 }}
    />
  );
}
