# ChessOps Dashboard — Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### 3. Feature Flag (Optional)

By default, the ChessOps Dashboard is **enabled**. To switch back to the simple chat UI:

Create a `.env.local` file in the frontend root:
```env
VITE_FEATURE_CHESSOPS_DASHBOARD=false
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.tsx                 # Main app with feature flag
│   ├── features/
│   │   └── chessops-dashboard/
│   │       ├── DISCOVERY.md    # Implementation plan & audit
│   │       ├── README.md       # Feature documentation
│   │       ├── components/     # UI components
│   │       ├── store/          # Zustand state management
│   │       ├── types/          # TypeScript types
│   │       └── lib/            # Mock data & utilities
│   └── components/ui/          # shadcn/ui components
```

## 🎨 Features Implemented

### ✅ Top Bar
- Real-time status indicators (Pipeline, Agents, Cameras)
- Connection health badges
- Live clock
- Theme toggle
- Settings button

### ✅ Camera Wall (Left Panel)
- **Dual camera feeds** (robot-arm, top-down)
- Live/static mode toggle
- Overlays (grid, keypoints, corners)
- Playback controls
- Health indicators (FPS, latency, resolution)
- Hover controls (play/pause, snapshot, fullscreen)

### ✅ Debug Workbench (Center Panel)
- **Timeline Chart** (Recharts)
  - Multi-series: latency, confidence, detections
  - Brush/zoom with live data
  - Real-time updates (30 FPS simulation)
- **Tabbed Detail Views**:
  - **Pipeline**: Visual stepper (Raw → Detection → Crop → Classify → Validate)
  - **Scores Table**: TanStack Table with sorting, filtering, virtualization
  - **Heatmaps**: Placeholder (future implementation)
  - **Boardstate**: Placeholder (future implementation)
  - **Alerts**: Placeholder (future implementation)

### ✅ Right Panel
- **Chat Panel**
  - AI assistant with contextual tools
  - Quick actions (Explain Frame, Why Changed?, Next Move, Bug Report)
  - Streaming simulation
  - Message history
- **Agent Observatory**
  - Multi-agent swimlane timeline
  - Event cards (messages, tool calls, results)
  - Real-time status indicators
  - Agent grouping by role

### ✅ Cross-Linking
- **Timeline brush** → updates `selection.time_window` in store
- **Table row click** → sets `selected_frame_id` and `selected_cells`
- All components read from shared Zustand store

### ✅ Animations & Polish
- Smooth transitions (opacity, transform, ≤180ms)
- Hover effects on cards, buttons, overlays
- Loading skeletons
- Typing indicators
- Status animations (pulse, spin, bounce)
- `prefers-reduced-motion` support

## 🔗 Backend Integration (TODO)

The dashboard currently uses **mock data**. To integrate with a real backend:

### 1. Create Event Bus (`lib/eventBus.ts`)

```typescript
// WebSocket/SSE client for real-time events
export function connectPipelineStream(url: string) {
  const eventSource = new EventSource(url);
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    useDashboardStore.getState().addPipelineEvent(data);
  };
}
```

### 2. Update Components

Replace `generateMockPipelineEvents()` calls with:
```typescript
useEffect(() => {
  connectPipelineStream('/api/pipeline/events');
}, []);
```

### 3. Camera Streams

Update `CameraFeed` component to accept real stream URLs:
```typescript
<video src={feed.url} autoPlay />
```

Supported protocols: MJPEG, HLS, WebRTC (via `<RTCVideo>` wrapper)

### 4. Agent Events

Similar to pipeline events, connect to agent event stream:
```typescript
connectAgentStream('/api/agents/events');
```

## 📊 Mock Data

All mock data generators are in `lib/mockData.ts`:

- `generateMockPipelineEvents(count)` — realistic frame events
- `generateMockAgentEvents(count)` — agent messages/tool calls
- `mockCameraFeeds` — camera metadata
- `mockChatMessages` — conversation history

## 🧪 Testing the Dashboard

### Verify Cross-Linking

1. **Timeline → Table**:
   - Use brush on timeline to select a time range
   - Scores table should filter to that range

2. **Table → Selection**:
   - Click a row in Scores table
   - Check that `selection.selected_frame_id` updates in store

3. **Live Updates**:
   - Watch timeline and agent lanes for simulated real-time data
   - Should see ~30 FPS pipeline updates, ~2/sec agent events

### Check Animations

1. Enable dark mode → smooth theme transition
2. Hover over camera cards → control overlay fades in
3. Pipeline stepper → stages animate on complete
4. Agent event cards → typing indicators, spinners

### Performance

- Timeline with 1000 frames: Should render smoothly
- Scores table with 10k+ rows: Virtualized, no lag
- Agent lanes with 500 events: Smooth scrolling

## 🎨 Customization

### Theme

Colors are defined in `src/index.css` using CSS variables. To customize:

```css
:root {
  --primary: 0 0% 20.5%;        /* Primary color */
  --primary-foreground: 0 0% 98.5%;
  /* ... other variables */
}
```

### Layout

Adjust panel widths in `DashboardLayout.tsx`:
```typescript
const [leftWidth, setLeftWidth] = useState(30);  // 30%
const [rightWidth, setRightWidth] = useState(25); // 25%
```

### Mock Data Frequency

In component `useEffect`:
```typescript
// Pipeline: 30 FPS
setInterval(() => addPipelineEvent(...), 33);

// Agents: 2/sec
setInterval(() => addAgentEvent(...), 500);
```

## 🐛 Troubleshooting

### Dashboard Not Showing

1. Check feature flag in `.env.local` (should be true or omitted)
2. Verify `src/App.tsx` imports `ChessOpsDashboard` correctly
3. Check browser console for errors

### No Mock Data

1. Ensure components call `useEffect` hooks to initialize data
2. Check `useDashboardStore` in DevTools (Zustand)
3. Verify `mockData.ts` exports are correct

### Styling Issues

1. Ensure Tailwind CSS is configured (`tailwind.config.js`)
2. Check `src/index.css` imports Tailwind directives
3. Run `npm run build` to regenerate CSS

### Performance Issues

1. Enable production mode: `npm run build && npm run preview`
2. Check for console warnings (React keys, memo issues)
3. Reduce mock data frequency in components

## 📦 Build for Production

```bash
npm run build
```

Output will be in `dist/` directory. Deploy to any static host (Vercel, Netlify, etc.).

## 🤝 Contributing

1. Create feature branch: `feat/your-feature`
2. Follow existing code style (TypeScript strict, functional components)
3. Add types for all data structures
4. Test with mock data before backend integration
5. Update README if adding new features

## 📝 Next Steps

### Immediate

- [ ] Add Heatmaps tab (board-shaped confidence grid)
- [ ] Add Boardstate tab (SVG chessboard with pieces)
- [ ] Add Alerts tab (anomalies with quick actions)
- [ ] Implement Command Palette (Cmd+K)
- [ ] Add Toast notifications

### Backend Integration

- [ ] WebSocket/SSE client (`lib/eventBus.ts`)
- [ ] Camera stream integration (MJPEG/WebRTC)
- [ ] Real-time state sync
- [ ] Authentication/session management

### Polish

- [ ] Conversation Graph for agents (force-directed layout)
- [ ] Lightbox for full-screen frame inspection
- [ ] Export functionality (CSV, JSON, PNG)
- [ ] Bug report generator
- [ ] Settings panel
- [ ] Onboarding tour

## 📄 License

Match repo license.

---

**Built with ❤️ for KnightHacks 2025**

Questions? Check `DISCOVERY.md` for implementation details or `README.md` in the feature folder.

