"use client";

import dynamic from "next/dynamic";

const ReactPlayer = dynamic(() => import("react-player"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-white/5">
      <span className="text-sm text-muted-foreground">Loading player…</span>
    </div>
  ),
});

export function YouTubePlayer({ url }: { url: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl">
      <ReactPlayer src={url} width="100%" height="100%" controls />
    </div>
  );
}
