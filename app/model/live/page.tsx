"use client";

import { useState } from "react";
import { Radio, Copy, Check } from "lucide-react";

interface StreamInfo {
  roomId: string;
  streamKey: string;
  rtmpUrl: string;
  playbackId: string;
}

export default function LivePage() {
  const [title, setTitle] = useState("");
  const [tokenCost, setTokenCost] = useState(20);
  const [stream, setStream] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [copied, setCopied] = useState<"key" | "url" | null>(null);
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
    try {
      data = await res.json();
    } catch {
      setError("Server error — check the terminal for details");
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError(data.error || "Failed to start stream");
    } else {
      setStream(data as unknown as StreamInfo);
    }
    setLoading(false);
  }

  async function endStream() {
    if (!stream) return;
    setEnding(true);
    await fetch("/api/live/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: stream.roomId }),
    });
    setStream(null);
    setEnding(false);
    setTitle("");
  }

  function copy(text: string, type: "key" | "url") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Radio className={`w-6 h-6 ${stream ? "text-red-500 animate-pulse" : "text-zinc-400"}`} />
        <h1 className="text-2xl font-bold text-zinc-50">
          {stream ? "You are LIVE" : "Go Live"}
        </h1>
      </div>

      {!stream ? (
        <div className="space-y-4">
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
              type="number"
              min={0}
              max={9999}
              value={tokenCost}
              onChange={(e) => setTokenCost(Number(e.target.value))}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={startStream}
            disabled={loading}
            className="w-full py-2.5 gradient-brand text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Radio className="w-4 h-4" />
            {loading ? "Setting up…" : "Start stream"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-red-950/20 border border-red-900 rounded-xl">
            <p className="text-red-400 font-medium text-sm mb-1">Stream is live</p>
            <p className="text-zinc-300 text-sm">{title}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-300">
              Paste these into OBS (Settings → Stream):
            </p>

            <InfoRow
              label="RTMP URL"
              value={stream.rtmpUrl}
              onCopy={() => copy(stream.rtmpUrl, "url")}
              copied={copied === "url"}
            />
            <InfoRow
              label="Stream Key"
              value={stream.streamKey}
              secret
              onCopy={() => copy(stream.streamKey, "key")}
              copied={copied === "key"}
            />
          </div>

          <button
            onClick={endStream}
            disabled={ending}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
          >
            {ending ? "Ending…" : "End stream"}
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  secret,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  secret?: boolean;
  onCopy: () => void;
  copied: boolean;
}) {
  const [show, setShow] = useState(!secret);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm text-zinc-200 font-mono break-all">
          {show ? value : "••••••••••••••••"}
        </code>
        {secret && (
          <button
            onClick={() => setShow(!show)}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
        <button
          onClick={onCopy}
          className="p-1.5 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 rounded transition"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
