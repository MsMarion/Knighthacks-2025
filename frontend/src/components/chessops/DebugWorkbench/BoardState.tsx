"use client";
import { useEffect, useState } from "react";
import { apiCurrentBoardSvg, apiNextMove } from "@/lib/api";

export function BoardState() {
  const [svg, setSvg] = useState<string | null>(null);

  async function refresh() {
    try { setSvg(await apiCurrentBoardSvg()); } catch { /* ignore */ }
  }
  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className="rounded-xl bg-zinc-900 px-3 py-1 text-sm" onClick={refresh}>Refresh</button>
        <button
          className="rounded-xl bg-fuchsia-500/20 px-3 py-1 text-sm hover:bg-fuchsia-500/25"
          onClick={async () => {
            const j = await apiNextMove();
            setSvg(j.board_svg_with_move);
          }}
        >
          Compute next move
        </button>
      </div>
      <div className="rounded-2xl bg-zinc-900 p-3">
        {svg ? <div dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="text-sm text-zinc-400">No board yet.</div>}
      </div>
    </div>
  );
}
