/**
 * Dashboard State Store (Zustand)
 * 
 * Manages shared selection state for cross-component linking:
 * - Timeline brush → filters table & tabs
 * - Table row selection → highlights overlays
 * - Heatmap hover → shows previews
 * - Agent thread selection → syncs with pipeline
 */

import { create } from "zustand";
import type {
  SelectionContext,
  PipelineFrameEvent,
  AgentEvent,
  CameraFeed,
} from "../types";

interface DashboardState {
  // Selection context (for cross-linking)
  selection: SelectionContext;
  setTimeWindow: (start: number, end: number) => void;
  setSelectedFrame: (frameId: string | undefined) => void;
  setSelectedCells: (cells: string[]) => void;
  setSelectedThread: (threadId: string | undefined) => void;
  setHoveredCell: (cell: string | undefined) => void;
  clearSelection: () => void;

  // Pipeline events (last N frames)
  pipelineEvents: PipelineFrameEvent[];
  addPipelineEvent: (event: PipelineFrameEvent) => void;
  clearPipelineEvents: () => void;

  // Agent events (last M events)
  agentEvents: AgentEvent[];
  addAgentEvent: (event: AgentEvent) => void;
  clearAgentEvents: () => void;

  // Camera feeds
  cameraFeeds: Record<string, CameraFeed>;
  updateCameraFeed: (id: string, feed: Partial<CameraFeed>) => void;

  // UI state
  leftPanelWidth: number;
  rightPanelWidth: number;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;

  activeTab: string; // "pipeline" | "scores" | "heatmap" | "boardstate" | "alerts"
  setActiveTab: (tab: string) => void;

  observatoryView: "lanes" | "graph";
  setObservatoryView: (view: "lanes" | "graph") => void;

  // Connection health
  pipelineConnected: boolean;
  agentConnected: boolean;
  setPipelineConnected: (connected: boolean) => void;
  setAgentConnected: (connected: boolean) => void;
}

const MAX_PIPELINE_EVENTS = 1000; // Keep last 1000 frames (~33s at 30Hz)
const MAX_AGENT_EVENTS = 500; // Keep last 500 agent events

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial selection state
  selection: {},

  setTimeWindow: (start, end) =>
    set((state) => ({
      selection: { ...state.selection, time_window: { start_timestamp: start, end_timestamp: end } },
    })),

  setSelectedFrame: (frameId) =>
    set((state) => ({
      selection: { ...state.selection, selected_frame_id: frameId },
    })),

  setSelectedCells: (cells) =>
    set((state) => ({
      selection: { ...state.selection, selected_cells: cells },
    })),

  setSelectedThread: (threadId) =>
    set((state) => ({
      selection: { ...state.selection, selected_thread_id: threadId },
    })),

  setHoveredCell: (cell) =>
    set((state) => ({
      selection: { ...state.selection, hovered_cell: cell },
    })),

  clearSelection: () =>
    set(() => ({
      selection: {},
    })),

  // Pipeline events management
  pipelineEvents: [],

  addPipelineEvent: (event) =>
    set((state) => {
      const newEvents = [...state.pipelineEvents, event];
      // Keep only last MAX_PIPELINE_EVENTS
      if (newEvents.length > MAX_PIPELINE_EVENTS) {
        return { pipelineEvents: newEvents.slice(-MAX_PIPELINE_EVENTS) };
      }
      return { pipelineEvents: newEvents };
    }),

  clearPipelineEvents: () => set(() => ({ pipelineEvents: [] })),

  // Agent events management
  agentEvents: [],

  addAgentEvent: (event) =>
    set((state) => {
      const newEvents = [...state.agentEvents, event];
      // Keep only last MAX_AGENT_EVENTS
      if (newEvents.length > MAX_AGENT_EVENTS) {
        return { agentEvents: newEvents.slice(-MAX_AGENT_EVENTS) };
      }
      return { agentEvents: newEvents };
    }),

  clearAgentEvents: () => set(() => ({ agentEvents: [] })),

  // Camera feeds
  cameraFeeds: {},

  updateCameraFeed: (id, feedUpdate) =>
    set((state) => ({
      cameraFeeds: {
        ...state.cameraFeeds,
        [id]: {
          ...state.cameraFeeds[id],
          ...feedUpdate,
        } as CameraFeed,
      },
    })),

  // UI state
  leftPanelWidth: 30, // percentage
  rightPanelWidth: 25, // percentage
  setLeftPanelWidth: (width) => set(() => ({ leftPanelWidth: width })),
  setRightPanelWidth: (width) => set(() => ({ rightPanelWidth: width })),

  activeTab: "pipeline",
  setActiveTab: (tab) => set(() => ({ activeTab: tab })),

  observatoryView: "lanes",
  setObservatoryView: (view) => set(() => ({ observatoryView: view })),

  // Connection health
  pipelineConnected: false,
  agentConnected: false,
  setPipelineConnected: (connected) => set(() => ({ pipelineConnected: connected })),
  setAgentConnected: (connected) => set(() => ({ agentConnected: connected })),
}));

