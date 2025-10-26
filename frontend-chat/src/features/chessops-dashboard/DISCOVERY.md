# ChessOps Dashboard — Discovery & Planning

**Date**: 2025-10-26  
**Goal**: Build a production-grade, real-time chess detection dashboard that unifies camera feeds, pipeline debugging, chat UI, and agent-to-agent visualization.

---

## 1. Codebase Audit

### 1.1 Framework & Build System
**FOUND**: 
- React 19.2.0 + TypeScript 5.9.3
- Vite 7.1.7 (SWC-based React plugin)
- Tailwind CSS 4.1.16 (v4 with @tailwindcss/vite plugin)
- Path aliases configured: `@/*` → `./src/*`

**CONCLUSION**: Modern stack with fast dev server. Tailwind v4 uses CSS-first config.

### 1.2 Component Library
**FOUND**:
- shadcn/ui (New York style) with `components.json` configured
- Existing components in `src/components/ui/`:
  - `alert-dialog.tsx`
  - `avatar.tsx`
  - `badge.tsx`
  - `button.tsx`
  - `card.tsx`
  - `input.tsx`
  - `progress.tsx`
  - `scroll-area.tsx`
  - `separator.tsx`
  - `skeleton.tsx`
  - `tabs.tsx`
  - `textarea.tsx`
  - `tooltip.tsx`

**MISSING** (need to add via shadcn MCP):
- `resizable` — for 3-panel layout
- `dialog` — for modals/lightboxes
- `sheet` — for drawer/side panels
- `command` — for command palette
- `hover-card` — for previews
- `toast` / `sonner` — for notifications
- `menubar` — for top-level menus
- `toggle-group` — for view switchers
- `accordion` — for collapsible sections

**CONCLUSION**: Reuse existing UI components; add missing ones via MCP.

### 1.3 State Management
**FOUND**:
- Zustand 5.0.8 already installed
- `src/features/chessops-dashboard/store/dashboardStore.ts` — well-structured store with:
  - Selection context (time window, frame, cells, thread, hovered cell)
  - Pipeline events (LRU cache, max 1000)
  - Agent events (LRU cache, max 500)
  - Camera feeds (keyed by id)
  - UI state (panel widths, active tab, observatory view)
  - Connection health flags

**CONCLUSION**: Store is production-ready; just need to wire up components.

### 1.4 Charts & Tables
**FOUND**:
- Recharts 3.3.0 — declarative charting library
- TanStack Table 8.21.3 — headless table with virtualization support

**CONCLUSION**: Both libraries are best-in-class for their use cases. Use Recharts for Timeline, TanStack Table for Scores.

### 1.5 Icons
**FOUND**:
- Lucide React 0.548.0

**CONCLUSION**: Use lucide-react for all iconography.

### 1.6 Existing Chat UI
**FOUND** in `src/App.tsx`:
- Simple chat interface with:
  - `ScrollArea` for messages
  - `Avatar` for user/AI
  - `Textarea` + `Button` for input
  - Basic message rendering (AI on left, user on right)

**CONCLUSION**: **Reuse this pattern** in `ChatPanel.tsx`. Wrap the existing layout, don't replace it.

### 1.7 Backend APIs

#### Chess Detection API (FastAPI)
**FILE**: `chess_detection/Chess2FEN/api_server.py`  
**ENDPOINTS**:
- `POST /predict` — Upload image, get FEN prediction
  - Params: `image` (file), `a1_pos` (BL|BR|TL|TR)
  - Returns: `{ fen, board_ascii, board_svg }`
  - Updates server state: `current_fen`
- `GET /nextmove` — Get best move from Stockfish
  - Returns: `{ best_move: { uci, san, score }, new_fen, board_svg_with_move }`
- `POST /set_elo` — Set engine difficulty
  - Body: `{ "elo": 1320-3190 }`
- `GET /current_board` — Returns SVG of current board
- `GET /visualize_next_move` — Returns SVG with best move arrow

**DATA CONTRACTS**:
```python
# Stateful server maintains:
ServerState:
  current_fen: str  # FEN string
  current_elo: int  # Stockfish Elo (1320-3190)
```

**MISSING**:
- No real-time pipeline event stream (no SSE/WebSocket)
- No frame-by-frame metrics (stage timings, confidence, anomalies)
- No agent orchestration system
- No camera stream endpoints

**CONCLUSION**: Backend only supports **on-demand FEN prediction + move generation**. Real-time features (pipeline events, agent events, camera streams) **do not exist**. Use **mock data** for now.

#### Pipeline Event Contract (DESIRED, not implemented)
```typescript
interface PipelineFrameEvent {
  frame_id: string;
  timestamp: number;
  stage_timings?: { preprocess_ms, board_detect_ms, grid_fit_ms, crop_ms, classify_ms, postprocess_ms };
  board_geometry?: { corners, cell_centers, reprojection_error, skew };
  cell_scores?: Array<{ cell, top1_class, top1_confidence, top_k, entropy, delta_vs_previous }>;
  accepted_board_state?: { fen, last_move, pgn, diff };
  anomalies?: Array<{ type, severity, message, affected_cells }>;
  debug_artifacts?: { raw_frame_url, warped_board_url, crops };
}
```

**STATUS**: ❌ Backend does NOT emit this. Mock data available in `lib/mockData.ts`.

#### Agent Event Contract (DESIRED, not implemented)
```typescript
interface AgentEvent {
  id: string;
  timestamp: number;
  agent: string;
  role: AgentRole;
  kind: "message" | "tool_call" | "tool_result" | "status";
  content?: string;
  tool?: string;
  args?: Record<string, any>;
  result?: any;
  parent_id?: string;
  thread_id?: string;
  references?: { frame_id?, cells? };
  latency_ms?: number;
  error?: { message, code, retry_count };
}
```

**STATUS**: ❌ No agent system exists. Mock data available.

#### Camera Feed Contract (DESIRED, not implemented)
```typescript
interface CameraFeed {
  id: string; // "robot-arm" | "top-down"
  label: string;
  url?: string;
  protocol: "mjpeg" | "webrtc" | "hls" | "ws" | "static";
  resolution?: { width, height };
  fps?: number;
  health: CameraHealth;
  latency_ms?: number;
  error_message?: string;
}
```

**STATUS**: ❌ Backend does NOT expose camera streams. Mock feeds available.

---

## 2. Reuse Plan

### 2.1 Components (Reuse)
- `src/components/ui/*` — all existing shadcn components
- Chat message layout pattern from `App.tsx`
- `ScrollArea`, `Avatar`, `Badge`, `Card`, `Skeleton`, `Tooltip`, `Tabs`

### 2.2 Components (Add via shadcn MCP)
- `resizable` — three-panel layout with drag handles
- `dialog` — lightbox for full-screen frame inspection
- `sheet` — message drawer for agent event details
- `command` — quick actions palette (Cmd+K)
- `hover-card` — crop/logit previews on hover
- `toast` / `sonner` — notifications for reconnections, anomalies
- `menubar` — top-level controls
- `toggle-group` — view switchers (Lanes vs Graph)
- `accordion` — collapsible sections in tabs

### 2.3 State (Reuse)
- `src/features/chessops-dashboard/store/dashboardStore.ts` — fully use existing store

### 2.4 Data (Extend)
- `lib/mockData.ts` — already has generators for pipeline/agent/camera/chat
- **Action**: Wire mock data to Zustand store in components

---

## 3. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Backend (Future: SSE/WebSocket)                         │
│  - Pipeline events stream                               │
│  - Agent events stream                                  │
│  - Camera MJPEG/WebRTC feeds                            │
└───────────────────┬─────────────────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │ Event Bus Adapter   │  ← TO BE BUILT (lib/eventBus.ts)
         │ (WebSocket/SSE)     │
         └──────────┬──────────┘
                    │
         ┌──────────▼──────────┐
         │ Zustand Store       │  ← ALREADY EXISTS
         │ dashboardStore.ts   │
         │  - pipelineEvents[] │
         │  - agentEvents[]    │
         │  - selection{}      │
         └──────────┬──────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
┌─────▼─────┐ ┌────▼────┐ ┌──────▼──────┐
│ CameraWall│ │DebugWb  │ │ RightPanel  │
│ - overlays│ │- Timeline│ │ - Chat      │
│           │ │- Scores  │ │ - AgentObs  │
└───────────┘ └──────────┘ └─────────────┘
```

**Current State**: No backend stream → use mock data in components.  
**Future**: Replace `useState(mockData)` with `useDashboardStore` + live event bus.

---

## 4. Implementation Phases

### Phase 1: Missing Components (shadcn MCP)
✅ Add Resizable, Dialog, Sheet, Command, HoverCard, Toast, Menubar, ToggleGroup, Accordion

### Phase 2: Top Bar
✅ Status badges (pipeline connected, agent connected, camera health)  
✅ Session selector (dropdown)  
✅ Quick actions (Command palette trigger)  
✅ Theme toggle

### Phase 3: Camera Wall
✅ Dual camera feeds (robot-arm, top-down)  
✅ Live video or static placeholders (mock: static images)  
✅ Overlay controls (grid, keypoints, boxes, pose HUD)  
✅ Playback controls (play/pause, snapshot, fullscreen)  
✅ Health indicators (FPS, latency, connection status)  
✅ Shimmer/skeleton while loading

### Phase 4: Debug Workbench — Timeline
✅ Recharts area/line chart with brush/zoom  
✅ Multi-series: total latency, avg confidence, num detections  
✅ Crosshair tooltip  
✅ Updates `selection.time_window` in store on brush

### Phase 5: Debug Workbench — Scores Table
✅ TanStack Table with virtualized rows  
✅ Columns: frame_id, cell, top1_class, top1_confidence, entropy, delta  
✅ Column filters (quick search, range sliders)  
✅ Row selection → sets `selected_frame_id` + `selected_cells`  
✅ Export to CSV/JSON

### Phase 6: Debug Workbench — Pipeline Stepper
✅ Horizontal stepper: Raw → Board Detect → Grid Fit → Crop → Classify → Validate  
✅ Each step shows thumbnail + timing badge  
✅ Hover highlights corresponding overlay region  
✅ Click opens lightbox (Dialog) for full-res inspection

### Phase 7: Debug Workbench — Tabs
✅ Tabs: Pipeline | Scores | Heatmaps | Boardstate | Alerts  
✅ All tabs respond to `selection.time_window` filter  
✅ Heatmaps: board-shaped grid with color scale (confidence/presence/change)  
✅ Boardstate: SVG chessboard with FEN/PGN display  
✅ Alerts: list of anomalies with quick actions

### Phase 8: Agent Observatory — Lanes View
✅ Vertical swimlanes per agent  
✅ Time flows downward  
✅ Message/tool_call cards with status indicators  
✅ Cross-agent arrows  
✅ Typing indicators, spinners, success pulses  
✅ Click event → opens Sheet drawer with details

### Phase 9: Chat Panel
✅ Reuse existing chat layout from App.tsx  
✅ Add contextual tools above input:
   - "Explain current frame"
   - "Why did state change?"
   - "Generate next move"
   - "Create bug report"
✅ Streaming token display (mock: simulate with setTimeout)  
✅ Tool call badges and results

### Phase 10: Right Panel Integration
✅ Tabs: Chat | Agents  
✅ Toggle between ChatPanel and AgentObservatory  
✅ Preserve scroll position on tab switch

### Phase 11: Polish & Animations
✅ Micro-animations: entrance (opacity+scale), hover, active state  
✅ Toast notifications (reconnected, anomaly detected)  
✅ Tooltips on all controls  
✅ Keyboard shortcuts (Arrow keys for timeline, Tab for navigation)  
✅ Respect `prefers-reduced-motion`  
✅ Loading skeletons for async states

### Phase 12: Testing & Cleanup
✅ Cross-linking verification (timeline ↔ table ↔ overlays ↔ agents)  
✅ Performance check (1000 pipeline events, 500 agent events)  
✅ Accessibility audit (keyboard nav, focus rings, ARIA)  
✅ Remove unused code, redundant files

---

## 5. Unknowns & Assumptions

### ❌ REPO-UNKNOWN
1. **Camera stream URLs**: Backend does NOT expose camera endpoints.  
   **Assumption**: Use static placeholder images for now; design UI to accept any protocol (MJPEG, WebRTC, HLS).

2. **Pipeline event stream**: Backend does NOT emit frame events.  
   **Assumption**: Mock 300 frames in memory; simulate 30 FPS updates.

3. **Agent orchestration**: No agent system exists.  
   **Assumption**: Mock agent events; design UI to accept any causal graph structure.

4. **Stockfish integration**: Only `/nextmove` endpoint exists (on-demand).  
   **Assumption**: UI triggers move generation on button click; no continuous analysis.

5. **Frame artifacts (crops, warped board)**: Backend does NOT expose intermediate images.  
   **Assumption**: Show placeholders in Pipeline Stepper; add "Not available" tooltips.

### ✅ CONFIRMED
1. **Tech stack**: React 19 + Vite 7 + Tailwind v4 + shadcn + Zustand + Recharts + TanStack Table  
2. **Feature flag**: `VITE_FEATURE_CHESSOPS_DASHBOARD` toggles dashboard vs simple chat  
3. **Existing UI components**: `components/ui/` has 13 shadcn components ready to use  
4. **Store structure**: `dashboardStore.ts` is well-designed for cross-linking  
5. **Mock data**: `lib/mockData.ts` provides realistic test data for all surfaces

---

## 6. File Structure (Final)

```
src/features/chessops-dashboard/
├── DISCOVERY.md               ← This file
├── README.md                  ← User-facing docs
├── index.tsx                  ← Public exports
├── types/
│   ├── pipeline.ts            ✅ Complete
│   ├── camera.ts              ✅ Complete
│   ├── agent.ts               ✅ Complete
│   ├── chat.ts                ✅ Complete
│   └── index.ts               ✅ Complete
├── store/
│   └── dashboardStore.ts      ✅ Complete
├── lib/
│   ├── mockData.ts            ✅ Complete
│   └── eventBus.ts            🔜 TO BUILD (for real backend)
└── components/
    ├── DashboardLayout.tsx    ✅ Basic layout exists
    ├── TopBar.tsx             🔨 TO IMPLEMENT
    ├── CameraWall/
    │   ├── CameraWall.tsx     🔨 TO IMPLEMENT
    │   ├── CameraFeed.tsx     🔨 TO BUILD
    │   └── CameraOverlay.tsx  🔨 TO BUILD
    ├── DebugWorkbench/
    │   ├── DebugWorkbench.tsx 🔨 TO IMPLEMENT
    │   ├── Timeline.tsx       🔨 TO IMPLEMENT
    │   ├── ScoresTable.tsx    🔨 TO IMPLEMENT
    │   ├── PipelineStepper.tsx 🔨 TO IMPLEMENT
    │   ├── Heatmaps.tsx       🔨 TO BUILD
    │   ├── Boardstate.tsx     🔨 TO BUILD
    │   └── Alerts.tsx         🔨 TO BUILD
    └── RightPanel/
        ├── RightPanel.tsx     🔨 TO IMPLEMENT
        ├── ChatPanel.tsx      🔨 TO IMPLEMENT
        ├── AgentObservatory.tsx 🔨 TO IMPLEMENT
        └── AgentLanes.tsx     🔨 TO BUILD
```

---

## 7. Next Steps

1. ✅ Install missing shadcn components via MCP
2. ✅ Implement TopBar with status indicators
3. ✅ Build CameraWall (static feeds for now)
4. ✅ Build Timeline (Recharts with brush)
5. ✅ Build ScoresTable (TanStack Table with virtualization)
6. ✅ Build PipelineStepper (horizontal stages)
7. ✅ Integrate DebugWorkbench tabs
8. ✅ Build AgentObservatory (Lanes view)
9. ✅ Build ChatPanel (reuse App.tsx pattern)
10. ✅ Add micro-animations and polish
11. ✅ Test cross-linking and performance
12. ✅ Document integration points for future backend

---

**Status**: Discovery complete. Ready to implement.  
**Risks**: None identified. All unknowns are documented with clear fallback strategies.  
**Estimated Complexity**: ~200 tool calls for complete implementation with polish.

