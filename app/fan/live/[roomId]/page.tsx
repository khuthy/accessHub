"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WatchLivePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data: session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const appID = Number(process.env.NEXT_PUBLIC_ZEGOCLOUD_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET!;
    if (!appID || !serverSecret || !session) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let zp: any = null;

    import("@zegocloud/zego-uikit-prebuilt").then(({ ZegoUIKitPrebuilt }) => {
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        session.user.id,
        session.user.username,
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

      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900"
        style={{ height: 560 }}
      />
    </div>
  );
}
