# ChessOps Dashboard - User Guide

Welcome to the ChessOps Dashboard! This guide will help you navigate and use all the features.

---

## 🚀 Getting Started

### Launching the Dashboard

1. The dashboard is enabled by default (feature flag: `VITE_FEATURE_CHESSOPS_DASHBOARD`)
2. Run `npm run dev` to start the development server
3. Open `http://localhost:5173` in your browser

---

## 🎯 Interface Overview

The dashboard has **3 main panels**:

### Left Panel: Camera Wall
- View live feeds from robot arm and top-down board cameras
- Toggle overlays using the eye icon
- Hover over feeds to reveal playback controls

### Center Panel: Debugging Workbench
- **Timeline**: View metrics over time, use brush to select time windows
- **5 Tabs**: Pipeline, Scores, Heatmaps, Boardstate, Alerts
- All views respond to timeline selection

### Right Panel: Chat & Agents
- **Chat Tab**: Ask questions and get AI responses
- **Agents Tab**: Watch agents communicate in real-time

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open Command Palette |
| `Cmd + P` | Jump to Pipeline tab |
| `Cmd + S` | Jump to Scores tab |
| `Cmd + H` | Jump to Heatmaps tab |
| `Cmd + B` | Jump to Boardstate tab |
| `Cmd + A` | Jump to Alerts tab |
| `Esc` | Close Command Palette |

---

## 📊 Using the Debugging Workbench

### Timeline Chart
1. **Brush Selection**: Click and drag on the timeline to select a time window
2. **Zoom**: Use the small chart below the main timeline
3. **Live Stats**: Current metrics shown as badges in the header

### Pipeline Tab
- Shows the 6-stage detection pipeline
- Each stage displays its timing
- Click stages to see more details (future feature)
- Green indicates complete, blue is processing

### Scores Table
1. **Search**: Use the search box to filter by cell, class, or frame
2. **Sort**: Click column headers to sort
3. **Select**: Click rows to highlight cells in heatmap and boardstate
4. **Export**: Click Export button for CSV/JSON

### Heatmaps Tab
1. **Mode Selector**: Choose Confidence, Presence, or Change Detection
2. **Hover**: See exact values for each cell
3. **Click**: Select cells to view in Scores table
4. **Legend**: Color scale explained at bottom

### Boardstate Tab
1. **View Position**: See live chess position with Unicode pieces
2. **FEN/PGN**: Copy notation using copy buttons
3. **Last Move**: Highlighted cells show the most recent move
4. **Changes**: View added, removed, and moved pieces

### Alerts Tab
1. **Severity Levels**: Red (error), Yellow (warning), Blue (info)
2. **Jump to Frame**: Click to sync all views to that frame
3. **Quick Actions**: Reprocess, Flag, or take suggested actions
4. **Dismiss**: Close alerts you've handled

---

## 🎥 Camera Controls

### Per-Feed Controls (on hover)
- **Play/Pause**: Control feed playback
- **Snapshot**: Capture current frame
- **Fullscreen**: Expand to full screen
- **Overlay Toggle**: Show/hide grid and markers

### Feed Indicators
- **Green Badge**: Connected and healthy
- **Yellow Badge**: Connecting or buffering
- **Red Badge**: Error or disconnected
- **FPS/Latency**: Real-time performance metrics

---

## 🤖 Agent Observatory

### Understanding Agent Lanes
- **Vertical Lanes**: One per agent (Perception, Rules Engine, etc.)
- **Time Flows Down**: Newest events at bottom
- **Event Cards**: Show messages, tool calls, and results
- **Arrows**: Connect related events across agents

### Event Types
- **Message**: Regular communication (blue badge)
- **Tool Call**: Function invocation (purple badge)
- **Tool Result**: Response from tool (green badge)
- **Status**: State change (gray badge)

### Indicators
- **Typing Dots**: Agent is composing
- **Spinner**: Waiting for tool call
- **Pulse**: Just completed
- **Shake**: Error occurred

---

## 💬 Chat Panel

### Quick Actions
Click pre-made prompts:
- **Explain Frame**: Get details about current frame
- **Why Changed?**: Understand state transitions
- **Next Move**: Generate best move
- **Bug Report**: Create issue summary

### Chatting
1. Type your question in the input box
2. Press `Enter` to send (or `Shift+Enter` for new line)
3. Watch for typing indicator as AI responds
4. Responses appear with timestamp and role badge

---

## 🔍 Command Palette

Press `Cmd/Ctrl + K` to open:

### Navigation Commands
- Go to Pipeline, Scores, Heatmaps, Boardstate, or Alerts

### Action Commands
- Clear Pipeline Events
- Clear Agent Events
- Clear Selection
- Export Data

### Camera Commands
- Snapshot All Cameras
- Play/Pause All Feeds

**Tip**: Start typing to filter commands!

---

## 🎨 Theme & Settings

### Theme Toggle
- Click the sun/moon icon in the top-right
- Dashboard is dark by default
- Switches between light and dark modes

### Settings (Future)
- Click the settings icon for preferences
- Currently shows modal (implementation pending)

---

## 🔗 Cross-Linking Features

The dashboard **synchronizes views automatically**:

1. **Select Time on Timeline** → Filters Scores table and all tabs
2. **Click Row in Scores** → Highlights cell in Heatmap and Boardstate
3. **Click Alert** → Jumps to frame and highlights affected cells
4. **Select Heatmap Cell** → Shows in Scores and Boardstate

---

## 📈 Performance Tips

### For Smooth Experience
- Clear old events periodically (via Command Palette)
- Use timeline brush to focus on recent data
- Close unused tabs in browser
- Disable overlays on cameras if not needed

### Data Limits
- **Pipeline Events**: Last 1000 frames kept (~33 seconds at 30 FPS)
- **Agent Events**: Last 500 events kept
- **Auto-cleanup**: Old data automatically removed (LRU)

---

## 🐛 Troubleshooting

### Dashboard Not Loading
- Check that feature flag is enabled in `.env.local`
- Ensure all dependencies are installed (`npm install`)
- Clear browser cache and reload

### Performance Issues
- Use Command Palette to clear events
- Reduce time window selection on timeline
- Check browser DevTools for console errors

### Animations Not Working
- Check if browser has `prefers-reduced-motion` enabled
- Try refreshing the page
- Ensure you're using a modern browser

---

## 🎓 Tips & Tricks

1. **Combine Timeline + Table**: Brush timeline, then sort table by confidence to find problem frames
2. **Use Heatmap Modes**: Switch between modes to identify patterns (Confidence for quality, Change for movement)
3. **Watch Agent Lanes**: See how agents collaborate on decisions
4. **Quick Navigation**: Memorize keyboard shortcuts for tab switching
5. **Contextual Chat**: Select a frame/cell, then ask questions about it

---

## 📞 Support & Feedback

- **Issues**: Report on GitHub (link TBD)
- **Questions**: Use the chat panel to ask the AI
- **Contributions**: See README.md for guidelines

---

**Happy Debugging! ♟️**

