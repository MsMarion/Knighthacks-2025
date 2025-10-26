import { create } from "zustand";

type TimeWindow = { start: number; end: number } | null;

interface SelectionState {
  frameId: string | null;
  cell?: string | null;
  threadId?: string | null;
  timeWindow: TimeWindow;
  setFrame: (id: string | null) => void;
  setCell: (c: string | null) => void;
  setThread: (t: string | null) => void;
  setWindow: (w: TimeWindow) => void;
}

export const useSelection = create<SelectionState>((set) => ({
  frameId: null,
  cell: null,
  threadId: null,
  timeWindow: null,
  setFrame: (frameId) => set({ frameId }),
  setCell: (cell) => set({ cell }),
  setThread: (threadId) => set({ threadId }),
  setWindow: (timeWindow) => set({ timeWindow })
}));
