"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GiftFeed } from "@/components/live/GiftFeed";

interface RoomInfo {
  id: string;
  title: string;
  tokenCost: number;
}

export default function WatchLivePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  // Look up DB room info using the ZEGOCLOUD room ID
  useEffect(() => {
    fetch(`/api/live/room/${roomId}`)
      .then((r) => r.json())
      .then((data) => { if (data.id) setRoomInfo(data); })
      .catch(() => {});
  }, [roomId]);

  useEffect(() => {
    const appID = Number(process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET!;
    if (!appID || !serverSecret || !session) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let zp: any = null;

    import("@zegocloud/zego-uikit-prebuilt").then(({ ZegoUIKitPrebuilt }) => {
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID, serverSecret, roomId, session.user.id, session.user.username,
      );
      zp = ZegoUIKitPrebuilt.create(kitToken);
      zp.joinRoom({
        container: containerRef.current,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: { role: ZegoUIKitPrebuilt.Audience },
        },
        showLeaveRoomConfirmDialog: false,
        showRoomDetailsButton: false,
      });
    });

    return () => { zp?.destroy(); };
  }, [roomId, session]);

  return (
    <div className="space-y-4 max-w-3xl">
      <Link
        href="/fan/browse"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to browse
      </Link>

      {roomInfo && (
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-100">{roomInfo.title}</h1>
          <span className="text-xs text-zinc-500 bg-red-950/30 border border-red-900 px-2 py-0.5 rounded-full text-red-400 font-medium">
            ● LIVE
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900"
        style={{ height: 500 }}
      />

      {/* Gift feed + send buttons */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
        <GiftFeed
          roomId={roomId}
          canSend={!!roomInfo}
          dbRoomId={roomInfo?.id}
        />
      </div>
    </div>
  );
}
