# ChessOps Dashboard

A comprehensive, real-time debugging and monitoring interface for the chess detection pipeline with integrated agent observatory.

## ✨ Features

### 🎥 Camera Wall
- **Dual Camera Feeds**: Robot arm + Top-down chessboard views
- **Live Overlays**: Grid visualization, keypoints, bounding boxes
- **Playback Controls**: Play/pause, snapshots, fullscreen
- **Health Monitoring**: Connection status, FPS, latency badges

### 🔬 Debugging Workbench
- **Timeline Chart**: Multi-series metrics (latency, confidence, detections) with brush/zoom
- **Pipeline Stepper**: Visual flow from raw frame → board detection → classification → FEN
- **Scores Table**: Sortable, filterable per-cell predictions with TanStack Table
- **Heatmaps**: Interactive board-shaped heatmap with confidence, presence, and change detection modes
- **Boardstate Viewer**: Live chess position with Unicode pieces, FEN/PGN display, and move history
- **Alerts Panel**: Real-time anomaly detection with severity levels and quick action buttons

### 🤖 Agent Observatory
- **Agent Lanes View**: Swimlane timeline showing agent messages and tool calls
- **Conversation Graph**: Force-directed graph of agent interactions (coming soon)
- **Message Drawer**: Detailed event inspection with latency and references
- **Real-time Status**: Live agent health and activity indicators

### 💬 Chat Panel
- **Contextual AI**: Ask questions about pipeline, board state, or agents
- **Quick Actions**: One-click explanations and move generation
- **Tool Calls**: Visual display of agent tool invocations
- **Streaming**: Token-by-token response with typing indicators

## 🏗️ Architecture

### State Management (Zustand)
```typescript
// Global selection context for cross-component linking
useDashboardStore({
  selection: {
    time_window,      // Timeline brush selection
    selected_frame_id, // Active frame for detail views
    selected_cells,    // Highlighted board cells
    selected_thread_id, // Agent conversation thread
    hovered_cell,      // Preview popover trigger
  },
  pipelineEvents: [], // Last 1000 frames
  agentEvents: [],    // Last 500 agent events
  // ... UI state, connection health
})
```

### Cross-Linking
- **Timeline brush** → filters Scores table & tabs
- **Table row selection** → highlights camera overlays
- **Heatmap hover** → previews crops & logits
- **Agent event** → jumps to referenced frame/cell

### Mock Data
Since backend APIs don't exist yet, comprehensive mock data demonstrates all features:
- `generateMockPipelineEvents(count)` — realistic frame events with timing, scores, anomalies
- `generateMockAgentEvents(count)` — agent messages, tool calls, results
- `mockCameraFeeds` — camera metadata and health
- `mockChatMessages` — conversation history

## 🚀 Getting Started

### 1. Enable Feature Flag
Create `frontend/.env.local`:
```bash
VITE_FEATURE_CHESSOPS_DASHBOARD=true
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

The dashboard will replace the simple chat UI when the feature flag is enabled.

### 4. Build for Production
```bash
npm run build
```

## 📁 File Structure

```
frontend/src/features/chessops-dashboard/
├── DISCOVERY.md           # Codebase audit & planning
├── README.md              # This file
├── index.tsx              # Main export
├── types/
│   ├── pipeline.ts        # Pipeline event types
│   ├── camera.ts          # Camera feed types
│   ├── agent.ts           # Agent event types
│   ├── chat.ts            # Chat message types
│   └── index.ts           # Unified exports
├── store/
│   └── dashboardStore.ts  # Zustand state management
├── lib/
│   └── mockData.ts        # Mock data generators
└── components/
    ├── DashboardLayout.tsx      # 3-panel resizable layout
    ├── TopBar.tsx               # Status badges & controls
    ├── CameraWall/
    │   └── CameraWall.tsx       # Dual camera feeds
    ├── DebugWorkbench/
    │   ├── DebugWorkbench.tsx   # Timeline + tabs
    │   ├── Timeline.tsx         # Recharts timeline
    │   ├── ScoresTable.tsx      # TanStack Table
    │   └── PipelineStepper.tsx  # Visual pipeline stages
    └── RightPanel/
        ├── RightPanel.tsx       # Chat/Agents tabs
        ├── ChatPanel.tsx        # Reusable chat UI
        └── AgentObservatory.tsx # Agent visualization
```

## 🔗 Backend Integration (TODO)

The dashboard is designed to work with the following backend APIs (not yet implemented):

### Pipeline Events (SSE/WebSocket)
```typescript
GET /api/pipeline/events
// Streams PipelineFrameEvent objects
```

### Camera Streams
```typescript
GET /api/cameras
// Returns CameraFeed[] with URLs and protocols
```

### Agent Events (SSE/WebSocket)
```typescript
GET /api/agents/events
// Streams AgentEvent objects
```

### Required Data Schemas
See `types/pipeline.ts`, `types/camera.ts`, and `types/agent.ts` for expected backend payloads. All fields marked `REPO-UNKNOWN` are not yet available from backend.

## 🎨 Design System

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4 + CSS Variables
- **Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts
- **Tables**: TanStack Table v8
- **State**: Zustand
- **Icons**: Lucide React

### Theme
- **Dark-first** design with OKLCH color space
- **Rounded corners** (rounded-2xl cards)
- **Subtle shadows** and generous spacing
- **Accessible** focus rings and ARIA labels
- **Motion**: ≤180ms transitions, respects `prefers-reduced-motion`

## 🧪 Development Notes

### Feature Flag
The dashboard is toggled via `VITE_FEATURE_CHESSOPS_DASHBOARD`. When disabled, the original simple chat UI renders.

### Mock Data
All data is currently mocked. To integrate with real backend:
1. Implement WebSocket/SSE clients in `lib/eventBus.ts` (not yet created)
2. Replace mock useState with actual data streams
3. Update `useDashboardStore` to consume live events
4. Add reconnection logic and error handling

### Performance
- **Timeline**: 300 frames rendered with Recharts brush
- **Scores Table**: Virtualized rows with TanStack Table
- **Agent Events**: Last 500 events kept in memory
- **Pipeline Events**: Last 1000 frames (~33s at 30Hz)

### Accessibility
- Keyboard navigation supported
- Focus visible rings on all interactive elements
- ARIA labels on controls
- Screen reader friendly table headers
- Motion can be disabled via OS settings

## 🎨 Enhanced Features

### ✅ Completed
- [x] Heatmap component with interactive board-shaped grid (confidence, presence, change modes)
- [x] Boardstate viewer with Unicode chess pieces and full FEN/PGN support
- [x] Alerts panel with severity-based filtering and quick actions
- [x] Command palette (Cmd+K) with keyboard shortcuts for navigation
- [x] Toast notifications system for real-time events
- [x] Enhanced animations and micro-interactions (fade-in, slide, pulse, glow)
- [x] Improved camera feed visuals with animated overlays and corner detection
- [x] Hover effects and transitions on all interactive elements

### Integration (requires backend)
- [ ] WebSocket/SSE client for pipeline events
- [ ] Camera stream integration (MJPEG/WebRTC)
- [ ] Agent event listener
- [ ] Real-time state sync between backend and frontend
- [ ] Authentication and session management

### Polish (Future Enhancements)
- [ ] Conversation graph force-directed layout (D3 or Cytoscape)
- [ ] Lightbox/dialog for full-screen frame inspection
- [ ] Enhanced export functionality (CSV, JSON, PNG)
- [ ] Bug report generator with artifact packaging
- [ ] Settings panel for theme and preferences
- [ ] Onboarding tour for new users
- [ ] Hover-card tooltips with extended cell information

## 🤝 Contributing

1. Create a topic branch: `feat/camera-feeds`, `fix/timeline-zoom`
2. Follow existing code style (TypeScript strict, functional components)
3. Add types for all data structures
4. Test with mock data before backend integration
5. Update this README if adding new features

## 📄 License

(Match repo license)

---

Built with ❤️ for KnightHacks 2025

