"use client";
import { AgentEvent } from "./types";

export function ConversationGraph({ events }: { events: AgentEvent[] }) {
  // Minimal stub: list edges (parent -> id). Replace with real graph viz later.
  const edges = events.filter(e => e.parent).map(e => ({ from: e.parent!, to: e.id, label: e.agent }));
  return (
    <div className="text-sm text-zinc-300">
      {edges.length === 0 ? (
        <div className="text-zinc-400">No causal links yet.</div>
      ) : (
        <ul className="space-y-1">
          {edges.slice(-100).map((ed, i) => (
            <li key={i} className="rounded-md bg-zinc-900 p-2">{ed.from} → {ed.to} <span className="text-zinc-500">({ed.label})</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}
