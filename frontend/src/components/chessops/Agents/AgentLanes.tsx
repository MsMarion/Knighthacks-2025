"use client";
import { AgentEvent } from "./types";
import { useState, useEffect } from "react";

function TimeDisplay({ timestamp }: { timestamp: number }) {
  const [timeString, setTimeString] = useState<string>("");
  
  useEffect(() => {
    setTimeString(new Date(timestamp).toLocaleTimeString());
  }, [timestamp]);
  
  return <span>{timeString}</span>;
}

export function AgentLanes({ events }: { events: AgentEvent[] }) {
  const agents = Array.from(new Set(events.map(e => e.agent)));
  return (
    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
      {agents.length === 0 && <div className="text-zinc-400">No agent events yet.</div>}
      {agents.map(a => (
        <div key={a} className="rounded-xl border border-white/10 p-2">
          <div className="mb-1 font-medium">{a}</div>
          <div className="space-y-1">
            {events.filter(e => e.agent===a).slice(-50).map(e => (
              <div key={e.id} className="rounded-lg bg-zinc-900 p-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{e.kind}</span>
                  <TimeDisplay timestamp={e.ts} />
                </div>
                {e.summary && <div className="mt-1 text-zinc-200">{e.summary}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
