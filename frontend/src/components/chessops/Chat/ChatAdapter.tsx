import type { ReactNode } from "react";

/** Shape your existing chat component must implement (zero-coupling). */
export type ChatAdapterProps = {
  className?: string;
  /** Optional context to inject (frameId/cell/thread) */
  context?: { frameId?: string|null; cell?: string|null; threadId?: string|null };
};

/** Replace this with your actual chat component export. */
export type ChatComponent = (p: ChatAdapterProps) => ReactNode;
