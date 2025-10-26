# Gemini ER-1.5 Agent Integration

This document describes the integration of Google Gemini ER-1.5 (Robotics-ER 1.5) agents into the A2A Agent system.

## Overview

The system now includes three specialized Gemini ER-1.5 agents:

1. **Vision Agent** - Computer vision and object detection
2. **Motion Agent** - Motion planning and trajectory generation  
3. **Coordination Agent** - Task coordination and orchestration

## Features

### Real-time Agent Status
- WebSocket server running on `ws://localhost:8002`
- Real-time status updates for all agents
- Thinking status exposure as JSON
- Agent communication visualization

### Graph Visualization
- Interactive graph showing agent relationships
- Real-time status indicators
- Current thought bubbles
- Connection lines between agents

### Agent Capabilities

#### Vision Agent
- Object detection and spatial reasoning
- Chess piece identification
- 3D coordinate computation
- Hand gesture detection

#### Motion Agent  
- Robotic arm trajectory planning
- Collision avoidance
- Smooth motion sequences
- Joint angle optimization

#### Coordination Agent
- Multi-agent collaboration
- Task sequencing
- Error handling
- System communication

## Setup

### Prerequisites
```bash
pip install google-genai websockets
```

### Environment Variables
```bash
export GEMINI_API_KEY="your-gemini-api-key-here"
```

### Running the System
```bash
# Start the agent system
python adk/agent.py

# In another terminal, start the frontend
cd frontend
npm run dev
```

## WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:8002');
```

### Message Format
```json
{
  "agent_id": "vision-agent",
  "status": "thinking",
  "current_thought": "Analyzing visual input...",
  "timestamp": 1234567890.123
}
```

### Status Types
- `idle` - Agent is not active
- `thinking` - Agent is processing/analyzing
- `processing` - Agent is executing actions
- `communicating` - Agent is sending messages
- `error` - Agent encountered an error

## Frontend Integration

The frontend automatically connects to the WebSocket and displays:
- Real-time agent status in graph visualization
- Agent communication timeline
- Current thoughts and processing status
- Connection status indicators

## Testing

Run the test script to verify functionality:
```bash
python adk/test_gemini_agent.py
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Vision Agent   │◄──►│ Coordination    │◄──►│  Motion Agent   │
│                 │    │    Agent        │    │                 │
│ - Object Detect │    │ - Orchestration │    │ - Trajectory    │
│ - Spatial Reason│    │ - Task Mgmt     │    │ - Path Planning │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Root Agent    │
                    │                 │
                    │ - Game Control  │
                    │ - User Interface│
                    └─────────────────┘
```

## WebSocket Flow

1. Agent starts processing
2. Status changes to "thinking"
3. Current thought is broadcast
4. Processing continues with updates
5. Status returns to "idle" when complete

## Error Handling

- Automatic WebSocket reconnection
- Graceful error states
- Connection status indicators
- Fallback to simulation mode

## Future Enhancements

- Agent performance metrics
- Historical data logging
- Advanced visualization options
- Multi-robot coordination
- Enhanced error recovery
