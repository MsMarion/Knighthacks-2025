"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

function TimeDisplay({ timestamp }: { timestamp: number }) {
  const [timeString, setTimeString] = useState<string>("");
  
  useEffect(() => {
    setTimeString(new Date(timestamp).toLocaleTimeString());
  }, [timestamp]);
  
  return <span>{timeString}</span>;
}
import { 
  Brain, 
  Network, 
  Zap, 
  MessageSquare, 
  Activity, 
  Cpu, 
  Database,
  GitBranch,
  Sparkles,
  Radio,
  Satellite,
  Orbit,
  TrendingUp,
  Target,
  Shield,
  Lock,
  Unlock,
  Eye,
  Search,
  Filter,
  Settings
} from "lucide-react";

// Technical Agent Types for Google A2A - Updated for Gemini ER-1.5
type AgentType = "vision-agent" | "motion-agent" | "coordination-agent" | "root-agent";

interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: "idle" | "thinking" | "communicating" | "processing" | "error";
  lastActivity: Date;
  messageCount: number;
  connections: string[];
  currentThought?: string;
  confidence: number;
  color: string;
  icon: React.ReactNode;
  description: string;
  // Enhanced WebSocket data
  thinkingBudget?: number;
  processingTime?: number;
  errorCount: number;
  successCount: number;
  totalRequests: number;
  averageResponseTime: number;
  lastError?: string;
  systemHealth: "excellent" | "good" | "warning" | "critical";
  memoryUsage?: number;
  cpuUsage?: number;
  activeConnections: number;
  throughput: number;
  latency: number;
  thinkingSteps: string[];
  currentTask?: string;
  taskProgress?: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    network: number;
  };
}

interface AgentMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  type: "thought" | "action" | "query" | "response";
  confidence: number;
}

interface WebSocketLog {
  id: string;
  timestamp: Date;
  type: "connection" | "message" | "error" | "status";
  content: string;
  agent?: string;
  raw?: any;
}

const AGENTS: Agent[] = [
  {
    id: "vision-agent",
    name: "ChessVision",
    type: "vision-agent",
    status: "idle",
    lastActivity: new Date(),
    messageCount: 0,
    connections: ["motion-agent", "coordination-agent"],
    confidence: 0.95,
    color: "from-blue-500 to-cyan-500",
    icon: <Eye className="size-5" />,
    description: "Analyzes chess board and identifies pieces",
    thinkingBudget: 0.5,
    processingTime: 0,
    errorCount: 0,
    successCount: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    systemHealth: "excellent",
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    throughput: 0,
    latency: 0,
    thinkingSteps: [],
    resourceUtilization: { cpu: 0, memory: 0, network: 0 }
  },
  {
    id: "motion-agent",
    name: "ChessBot",
    type: "motion-agent", 
    status: "idle",
    lastActivity: new Date(),
    messageCount: 0,
    connections: ["vision-agent", "coordination-agent"],
    confidence: 0.88,
    color: "from-purple-500 to-pink-500",
    icon: <Target className="size-5" />,
    description: "Executes physical chess moves",
    thinkingBudget: 0.5,
    processingTime: 0,
    errorCount: 0,
    successCount: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    systemHealth: "excellent",
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    throughput: 0,
    latency: 0,
    thinkingSteps: [],
    resourceUtilization: { cpu: 0, memory: 0, network: 0 }
  },
  {
    id: "coordination-agent",
    name: "GameMaster",
    type: "coordination-agent",
    status: "idle", 
    lastActivity: new Date(),
    messageCount: 0,
    connections: ["vision-agent", "motion-agent", "root-agent"],
    confidence: 0.92,
    color: "from-emerald-500 to-teal-500",
    icon: <Network className="size-5" />,
    description: "Coordinates game strategy and tactics",
    thinkingBudget: 0.5,
    processingTime: 0,
    errorCount: 0,
    successCount: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    systemHealth: "excellent",
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    throughput: 0,
    latency: 0,
    thinkingSteps: [],
    resourceUtilization: { cpu: 0, memory: 0, network: 0 }
  },
  {
    id: "root-agent",
    name: "ChessAI",
    type: "root-agent",
    status: "idle",
    lastActivity: new Date(),
    messageCount: 0,
    connections: ["coordination-agent"],
    confidence: 0.91,
    color: "from-orange-500 to-red-500",
    icon: <Brain className="size-5" />,
    description: "Makes strategic chess decisions",
    thinkingBudget: 0.5,
    processingTime: 0,
    errorCount: 0,
    successCount: 0,
    totalRequests: 0,
    averageResponseTime: 0,
    systemHealth: "excellent",
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    throughput: 0,
    latency: 0,
    thinkingSteps: [],
    resourceUtilization: { cpu: 0, memory: 0, network: 0 }
  }
];

export function AdvancedAgentObservatory() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [websocketLogs, setWebsocketLogs] = useState<WebSocketLog[]>([]);
  const [view, setView] = useState<"lanes" | "graph" | "timeline" | "pipeline">("graph");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);
  const [graphScale, setGraphScale] = useState(1);
  const [graphOffset, setGraphOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [debugImages, setDebugImages] = useState<string[]>([]);
  const [currentBoard, setCurrentBoard] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch debug images from debug_steps folder
  const fetchDebugImages = async () => {
    try {
      const response = await fetch('/api/debug-images');
      if (response.ok) {
        const data = await response.json();
        setDebugImages(data.images || []);
      }
    } catch (error) {
      console.error('Failed to fetch debug images:', error);
    }
  };

  // Fetch current board state
  const fetchCurrentBoard = async () => {
    try {
      const response = await fetch('http://localhost:8000/current_board');
      if (response.ok) {
        const svg = await response.text();
        setCurrentBoard(svg);
      }
    } catch (error) {
      console.error('Failed to fetch current board:', error);
    }
  };

  // Fetch initial data and set up polling
  useEffect(() => {
    fetchDebugImages();
    fetchCurrentBoard();
    
    // Poll for updates every 2 seconds
    const pollInterval = setInterval(() => {
      fetchDebugImages();
      fetchCurrentBoard();
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, []);

  // WebSocket connection for real-time agent updates
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:8002');
        websocketRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setWebsocketLogs(prev => [...prev.slice(-49), {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: "connection",
            content: "System connected",
            raw: { event: "open" }
          }]);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received agent update:', data);
            
            // Log system message
            setWebsocketLogs(prev => [...prev.slice(-49), {
              id: `log-${Date.now()}`,
              timestamp: new Date(),
              type: "message",
              content: `${data.agent_id} updated status`,
              agent: data.agent_id,
              raw: data
            }]);
            
            // Enhanced agent update with comprehensive data
            setAgents(prev => prev.map(agent => 
              agent.id === data.agent_id 
                ? { 
                    ...agent, 
                    status: data.status,
                    currentThought: data.current_thought,
                    lastActivity: new Date(data.timestamp * 1000),
                    // Enhanced metrics from WebSocket
                    thinkingBudget: data.thinking_budget || agent.thinkingBudget,
                    processingTime: data.processing_time || agent.processingTime,
                    errorCount: data.error_count !== undefined ? data.error_count : agent.errorCount,
                    successCount: data.success_count !== undefined ? data.success_count : agent.successCount,
                    totalRequests: data.total_requests !== undefined ? data.total_requests : agent.totalRequests,
                    averageResponseTime: data.avg_response_time || agent.averageResponseTime,
                    lastError: data.last_error || agent.lastError,
                    systemHealth: data.system_health || agent.systemHealth,
                    memoryUsage: data.memory_usage || agent.memoryUsage,
                    cpuUsage: data.cpu_usage || agent.cpuUsage,
                    activeConnections: data.active_connections || agent.activeConnections,
                    throughput: data.throughput || agent.throughput,
                    latency: data.latency || agent.latency,
                    thinkingSteps: data.thinking_steps || agent.thinkingSteps,
                    currentTask: data.current_task || agent.currentTask,
                    taskProgress: data.task_progress || agent.taskProgress,
                    resourceUtilization: data.resource_utilization || agent.resourceUtilization,
                    // Update message count
                    messageCount: agent.messageCount + (data.status === 'communicating' ? 1 : 0)
                  }
                : agent
            ));

            // Enhanced message handling with more context
            if (data.current_thought || data.status === 'communicating') {
              const newMessage: AgentMessage = {
                id: `msg-${Date.now()}`,
                from: data.agent_id,
                to: data.target_agent || 'system',
                content: data.current_thought || `${data.agent_id} is ${data.status}`,
                timestamp: new Date(data.timestamp * 1000),
                type: data.message_type || 'thought',
                confidence: data.confidence || 0.9
              };
              setMessages(prev => [...prev.slice(-49), newMessage]);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          setWebsocketLogs(prev => [...prev.slice(-49), {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: "connection",
            content: "System disconnected - reconnecting",
            raw: { event: "close" }
          }]);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
          setWebsocketLogs(prev => [...prev.slice(-49), {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: "error",
            content: "Connection error",
            raw: { error: error.toString() }
          }]);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // Simulate agent activity
  const simulateAgentActivity = () => {
    if (!isSimulating) return;

    const activeAgents = agents.filter(agent => agent.status !== "idle");
    const idleAgents = agents.filter(agent => agent.status === "idle");
    
    if (idleAgents.length > 0 && Math.random() < 0.3) {
      const randomAgent = idleAgents[Math.floor(Math.random() * idleAgents.length)];
      const targetAgent = randomAgent.connections[Math.floor(Math.random() * randomAgent.connections.length)];
      
      setAgents(prev => prev.map(agent => 
        agent.id === randomAgent.id 
          ? { ...agent, status: "thinking" as const, lastActivity: new Date() }
          : agent
      ));

      // Create a message between agents
      const newMessage: AgentMessage = {
        id: `msg-${Date.now()}`,
        from: randomAgent.id,
        to: targetAgent,
        content: generateAgentThought(randomAgent.type),
        timestamp: new Date(),
        type: "thought",
        confidence: Math.random() * 0.3 + 0.7
      };

      setMessages(prev => [...prev.slice(-49), newMessage]);

      // Update agent status after delay
      setTimeout(() => {
        setAgents(prev => prev.map(agent => 
          agent.id === randomAgent.id 
            ? { ...agent, status: "idle" as const, messageCount: agent.messageCount + 1 }
            : agent
        ));
      }, 2000 + Math.random() * 3000);
    }
  };

  const generateAgentThought = (type: AgentType): string => {
    const thoughts = {
      "vision-agent": [
        "Analyzing visual input for object detection and spatial reasoning...",
        "Processing camera feed to identify chess pieces and board state...",
        "Computing 3D coordinates for robotic manipulation tasks...",
        "Detecting hand gestures and human interactions..."
      ],
      "motion-agent": [
        "Planning trajectory for robotic arm movement...",
        "Computing safe paths to avoid collisions...",
        "Generating smooth motion sequences for chess piece manipulation...",
        "Optimizing joint angles for precise positioning..."
      ],
      "coordination-agent": [
        "Orchestrating multi-agent collaboration for chess gameplay...",
        "Coordinating vision and motion agents for complex tasks...",
        "Managing task sequencing and error handling...",
        "Facilitating communication between all system components..."
      ],
      "root-agent": [
        "Managing overall chess game strategy and decision making...",
        "Coordinating with human player and robotic system...",
        "Executing high-level game logic and rule enforcement...",
        "Providing user interface and game state management..."
      ]
    };
    
    const agentThoughts = thoughts[type];
    return agentThoughts[Math.floor(Math.random() * agentThoughts.length)];
  };

  useEffect(() => {
    if (isSimulating) {
      intervalRef.current = setInterval(simulateAgentActivity, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSimulating, agents]);

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
  };

  // Interactive graph functions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - graphOffset.x, y: e.clientY - graphOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setGraphOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(2, graphScale * scaleFactor));
    setGraphScale(newScale);
  };

  const resetView = () => {
    setGraphScale(1);
    setGraphOffset({ x: 0, y: 0 });
  };

  const handleAgentClick = (agentId: string) => {
    // Show brief agent info in compact format
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      // Create a brief notification or update the compact log
      setWebsocketLogs(prev => [...prev.slice(-49), {
        id: `click-${Date.now()}`,
        timestamp: new Date(),
        type: "status",
        content: `${agent.name} selected - ${agent.status}`,
        agent: agent.id,
        raw: { 
          status: agent.status, 
          confidence: agent.confidence,
          systemHealth: agent.systemHealth 
        }
      }]);
    }
  };

  const handleAgentHover = (agentId: string | null) => {
    setHoveredAgent(agentId);
  };


  const getStatusIcon = (status: Agent["status"]) => {
    switch (status) {
      case "idle": return <Shield className="size-4" />;
      case "thinking": return <Brain className="size-4 animate-pulse" />;
      case "communicating": return <Radio className="size-4" />;
      case "processing": return <Cpu className="size-4 animate-spin" />;
      case "error": return <Settings className="size-4" />;
      default: return <Shield className="size-4" />;
    }
  };

  // Helper functions for graph visualization
  const getAgentPosition = (agentId: string) => {
    const positions: { [key: string]: { x: number; y: number } } = {
      "vision-agent": { x: 150, y: 200 },
      "motion-agent": { x: 450, y: 200 },
      "coordination-agent": { x: 300, y: 350 },
      "root-agent": { x: 300, y: 100 }
    };
    return positions[agentId] || { x: 300, y: 250 };
  };

  const getStatusColor = (status: Agent["status"]) => {
    switch (status) {
      case "idle": return "#6b7280";
      case "thinking": return "#3b82f6";
      case "communicating": return "#10b981";
      case "processing": return "#f59e0b";
      case "error": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getGradientColor = (colorClass: string, index: number) => {
    const colorMap: { [key: string]: string[] } = {
      "from-blue-500 to-cyan-500": ["#3b82f6", "#06b6d4"],
      "from-purple-500 to-pink-500": ["#8b5cf6", "#ec4899"],
      "from-emerald-500 to-teal-500": ["#10b981", "#14b8a6"],
      "from-orange-500 to-red-500": ["#f97316", "#ef4444"]
    };
    return colorMap[colorClass]?.[index] || "#6b7280";
  };

  return (
    <div className="rounded-2xl bg-zinc-950 shadow-soft ring-1 ring-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Orbit className="size-7 text-fuchsia-400" />
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Satellite className="size-4 text-fuchsia-300" />
            </motion.div>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">Google A2A Agents</h3>
            <p className="text-sm text-zinc-400">Live A2A agent status and communication</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-sm font-medium text-zinc-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="w-px h-4 bg-zinc-700" />
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSimulating ? 'bg-blue-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="text-sm font-medium text-zinc-300">
                {isSimulating ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
          
          <button
            onClick={toggleSimulation}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isSimulating 
                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
            }`}
          >
            {isSimulating ? 'Stop AI' : 'Start AI'}
          </button>
          
          
          <div className="flex rounded-lg bg-zinc-800/50 p-1 border border-zinc-700">
            {(["lanes", "graph", "timeline", "pipeline"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-2 text-sm font-medium capitalize transition-all duration-200 ${
                  view === v 
                    ? 'bg-white/10 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "lanes" && (
          <motion.div
            key="lanes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {agents.map((agent) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                className={`rounded-xl border border-zinc-700/50 p-6 cursor-pointer transition-all duration-300 bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 ${
                  selectedAgent === agent.id ? 'ring-2 ring-fuchsia-500/50 border-fuchsia-500/30' : 'hover:border-zinc-600/50'
                }`}
                onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${agent.color} shadow-lg`}>
                      {agent.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-base text-white">{agent.name}</h4>
                      <p className="text-sm text-zinc-400 mb-2">{agent.description}</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(agent.status)}
                        <span className={`text-sm font-medium ${
                          agent.status === 'idle' ? 'text-zinc-400' :
                          agent.status === 'thinking' ? 'text-blue-400' :
                          agent.status === 'processing' ? 'text-orange-400' :
                          agent.status === 'communicating' ? 'text-green-400' :
                          'text-red-400'
                        }`}>
                          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 mb-1">Confidence</div>
                      <div className="text-lg font-semibold text-white">{Math.round(agent.confidence * 100)}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-500 mb-1">Activity</div>
                      <div className="text-lg font-semibold text-white">{agent.messageCount}</div>
                    </div>
                  </div>
                </div>

                {selectedAgent === agent.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-zinc-700/50"
                  >
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium text-zinc-300 mb-3">Agent Connections</div>
                        <div className="flex flex-wrap gap-2">
                          {agent.connections.map((connId) => {
                            const connAgent = agents.find(a => a.id === connId);
                            return (
                              <span
                                key={connId}
                                className="px-3 py-1 bg-zinc-800/50 rounded-lg text-sm font-medium text-zinc-200 border border-zinc-700/50"
                              >
                                {connAgent?.name.split(' ')[0]}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      
                      {agent.currentThought && (
                        <div>
                          <div className="text-sm font-medium text-zinc-300 mb-3">Current Processing</div>
                          <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/30">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                              <span className="text-sm font-medium text-zinc-300">Active Processing</span>
                            </div>
                            <div className="text-sm text-zinc-200 leading-relaxed">
                              {agent.currentThought}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-zinc-300 mb-2">Last Activity</div>
                          <div className="text-sm text-zinc-400">
                            {agent.lastActivity.toLocaleTimeString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-300 mb-2">Uptime</div>
                          <div className="text-sm text-zinc-400">
                            {Math.floor((Date.now() - agent.lastActivity.getTime()) / 1000)}s ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {view === "graph" && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative h-[300px] bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl overflow-hidden border border-zinc-800"
          >
            {/* Interactive controls */}
            <div className="absolute top-3 right-3 z-10 flex gap-2">
              <button
                onClick={resetView}
                className="px-3 py-1 bg-zinc-800/80 hover:bg-zinc-700/80 text-white text-xs rounded-lg border border-zinc-600/50 transition-all duration-200"
              >
                Reset View
              </button>
              <div className="px-3 py-1 bg-zinc-800/80 text-white text-xs rounded-lg border border-zinc-600/50">
                Zoom: {Math.round(graphScale * 100)}%
              </div>
            </div>

            {/* Compact WebSocket Log */}
            <div className="absolute bottom-3 right-3 w-80 max-h-32 overflow-y-auto z-10">
              <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg border border-zinc-700/50 shadow-lg">
                <div className="flex items-center justify-between p-2 border-b border-zinc-700/50">
                  <div className="flex items-center gap-2">
                    <Radio className="size-3 text-blue-400" />
                    <span className="text-xs font-medium text-white">System Log</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  </div>
                  <button
                    onClick={() => setWebsocketLogs([])}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Clear
                  </button>
                </div>
                <div className="p-2 space-y-1">
                  {websocketLogs.length === 0 ? (
                    <div className="text-xs text-zinc-500 text-center py-2">No system activity</div>
                  ) : (
                    websocketLogs.slice(-5).reverse().map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-center gap-2 text-xs ${
                          log.type === 'connection' ? 'text-blue-300' :
                          log.type === 'message' ? 'text-green-300' :
                          log.type === 'error' ? 'text-red-300' :
                          'text-zinc-300'
                        }`}
                      >
                        <div className={`w-1 h-1 rounded-full ${
                          log.type === 'connection' ? 'bg-blue-400' :
                          log.type === 'message' ? 'bg-green-400' :
                          log.type === 'error' ? 'bg-red-400' :
                          'bg-zinc-400'
                        }`} />
                        <span className="truncate">
                          {log.agent ? `${log.agent}: ` : ''}{log.content}
                        </span>
                        <span className="text-zinc-600 text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <svg 
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing" 
              viewBox="0 0 700 500"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              style={{
                transform: `translate(${graphOffset.x}px, ${graphOffset.y}px) scale(${graphScale})`,
                transformOrigin: 'center'
              }}
            >
              <defs>
                <style>
                  {`
                    @keyframes dash {
                      to { stroke-dashoffset: -12; }
                    }
                    @keyframes flow {
                      0% { opacity: 0; }
                      50% { opacity: 1; }
                      100% { opacity: 0; }
                    }
                  `}
                </style>
              </defs>
              {/* Interactive connection lines with data flow animation */}
              {agents.map(agent => 
                agent.connections.map(connId => {
                  const targetAgent = agents.find(a => a.id === connId);
                  if (!targetAgent) return null;
                  
                  const sourcePos = getAgentPosition(agent.id);
                  const targetPos = getAgentPosition(connId);
                  const isActive = agent.status !== "idle" || targetAgent.status !== "idle";
                  const isCommunicating = agent.status === "communicating" || targetAgent.status === "communicating";
                  const isHovered = hoveredAgent === agent.id || hoveredAgent === connId;
                  
                  return (
                    <g key={`${agent.id}-${connId}`}>
                      {/* Base connection line */}
                      <line
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={
                          isHovered ? "rgba(139, 92, 246, 0.5)" :
                          isActive ? "rgba(139, 92, 246, 0.3)" : "rgba(255, 255, 255, 0.08)"
                        }
                        strokeWidth={isHovered ? "2" : "1"}
                        className="transition-all duration-300"
                      />
                      
                      {/* Active data flow line */}
                      {isActive && (
                        <line
                          x1={sourcePos.x}
                          y1={sourcePos.y}
                          x2={targetPos.x}
                          y2={targetPos.y}
                          stroke="rgba(139, 92, 246, 0.8)"
                          strokeWidth="2"
                          strokeDasharray="8,4"
                          className="animate-pulse"
                          style={{
                            filter: "drop-shadow(0 0 6px rgba(139, 92, 246, 0.4))",
                            animation: isCommunicating ? "dash 1.5s linear infinite" : "none"
                          }}
                        />
                      )}
                      
                      {/* Data flow particles */}
                      {isCommunicating && (
                        <circle
                          r="3"
                          fill="rgba(139, 92, 246, 0.9)"
                          className="animate-pulse"
                          style={{
                            filter: "drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))",
                            animation: "flow 2s linear infinite"
                          }}
                        >
                          <animateMotion
                            dur="2s"
                            repeatCount="indefinite"
                            path={`M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`}
                          />
                        </circle>
                      )}
                    </g>
                  );
                })
              )}
              
              {/* Agent nodes - Interactive Design */}
              {agents.map((agent, index) => {
                const pos = getAgentPosition(agent.id);
                const isActive = agent.status !== "idle";
                const isThinking = agent.status === "thinking";
                const isProcessing = agent.status === "processing";
                const isHovered = hoveredAgent === agent.id;
                const isSelected = selectedAgent === agent.id;
                
                return (
                  <g 
                    key={agent.id}
                    onClick={() => handleAgentClick(agent.id)}
                    onMouseEnter={() => handleAgentHover(agent.id)}
                    onMouseLeave={() => handleAgentHover(null)}
                    className="cursor-pointer"
                  >
                    {/* Main agent node - interactive and professional */}
                    <rect
                      x={pos.x - 35}
                      y={pos.y - 20}
                      width={70}
                      height={40}
                      rx={8}
                      fill={
                        isSelected ? "rgba(139, 92, 246, 0.2)" :
                        isHovered ? "rgba(139, 92, 246, 0.15)" :
                        isActive ? "rgba(139, 92, 246, 0.1)" : "rgba(255, 255, 255, 0.05)"
                      }
                      stroke={
                        isSelected ? "rgba(139, 92, 246, 0.8)" :
                        isHovered ? "rgba(139, 92, 246, 0.6)" :
                        isActive ? "rgba(139, 92, 246, 0.4)" : "rgba(255, 255, 255, 0.1)"
                      }
                      strokeWidth={isSelected ? "3" : isHovered ? "2" : isActive ? "2" : "1"}
                      className="transition-all duration-300"
                      style={{
                        filter: isSelected ? "drop-shadow(0 0 12px rgba(139, 92, 246, 0.4))" :
                                isHovered ? "drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))" :
                                isActive ? "drop-shadow(0 0 8px rgba(139, 92, 246, 0.2))" : "none"
                      }}
                    />
                    
                    {/* Status indicator - subtle and professional */}
                    <circle
                      cx={pos.x + 25}
                      cy={pos.y - 10}
                      r={4}
                      fill={getStatusColor(agent.status)}
                      className={`transition-all duration-300 ${
                        isThinking ? 'animate-pulse' : ''
                      }`}
                      style={{
                        filter: isActive ? `drop-shadow(0 0 4px ${getStatusColor(agent.status)})` : 'none'
                      }}
                    />
                    
                    {/* Agent name - clean typography */}
                    <text
                      x={pos.x}
                      y={pos.y - 5}
                      textAnchor="middle"
                      className="text-sm fill-white font-semibold"
                    >
                      {agent.name.split(' ')[0]}
                    </text>
                    
                    {/* Status text - professional styling */}
                    <text
                      x={pos.x}
                      y={pos.y + 8}
                      textAnchor="middle"
                      className="text-xs fill-zinc-400 font-medium"
                    >
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </text>
                    
                    {/* Enhanced interactive tooltip on hover */}
                    {isHovered && (
                      <foreignObject
                        x={pos.x - 120}
                        y={pos.y - 100}
                        width={240}
                        height={180}
                        className="pointer-events-none"
                      >
                        <div className="bg-gradient-to-r from-zinc-800/95 to-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-zinc-600/30 shadow-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${agent.color}`}>
                              {agent.icon}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{agent.name}</div>
                              <div className="text-xs text-zinc-400">{agent.description}</div>
                            </div>
                          </div>
                          
                          {/* Status and Health */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{backgroundColor: getStatusColor(agent.status)}} />
                              <span className="text-xs text-zinc-300">{agent.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                agent.systemHealth === 'excellent' ? 'bg-green-400' :
                                agent.systemHealth === 'good' ? 'bg-blue-400' :
                                agent.systemHealth === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                              }`} />
                              <span className="text-xs text-zinc-300">{agent.systemHealth}</span>
                            </div>
                          </div>
                          
                          {/* Performance Metrics */}
                          <div className="space-y-1 mb-3">
                            <div className="text-xs text-zinc-300">
                              <span className="text-zinc-400">Confidence:</span> {Math.round(agent.confidence * 100)}%
                            </div>
                            <div className="text-xs text-zinc-300">
                              <span className="text-zinc-400">Requests:</span> {agent.totalRequests}
                            </div>
                            <div className="text-xs text-zinc-300">
                              <span className="text-zinc-400">Success Rate:</span> {agent.totalRequests > 0 ? Math.round((agent.successCount / agent.totalRequests) * 100) : 0}%
                            </div>
                            <div className="text-xs text-zinc-300">
                              <span className="text-zinc-400">Avg Response:</span> {agent.averageResponseTime.toFixed(1)}ms
                            </div>
                          </div>
                          
                          {/* Resource Utilization */}
                          <div className="space-y-1">
                            <div className="text-xs text-zinc-400 mb-1">Resource Usage</div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-300">CPU</span>
                                <div className="w-16 h-1 bg-zinc-700 rounded-full">
                                  <div 
                                    className="h-full bg-blue-400 rounded-full transition-all duration-300"
                                    style={{width: `${agent.resourceUtilization.cpu}%`}}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-300">Memory</span>
                                <div className="w-16 h-1 bg-zinc-700 rounded-full">
                                  <div 
                                    className="h-full bg-green-400 rounded-full transition-all duration-300"
                                    style={{width: `${agent.resourceUtilization.memory}%`}}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-zinc-300">Network</span>
                                <div className="w-16 h-1 bg-zinc-700 rounded-full">
                                  <div 
                                    className="h-full bg-purple-400 rounded-full transition-all duration-300"
                                    style={{width: `${agent.resourceUtilization.network}%`}}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </foreignObject>
                    )}
                    
                    {/* Real-time thinking display - positioned to avoid overlap */}
                    {agent.currentThought && (
                      <foreignObject
                        x={pos.x - 70}
                        y={pos.y + 30}
                        width={140}
                        height={60}
                        className="pointer-events-none"
                      >
                        <div className="bg-gradient-to-r from-zinc-800/95 to-zinc-900/95 backdrop-blur-sm rounded-lg p-2 border border-zinc-600/30 shadow-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{animationDelay: '0.2s'}} />
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{animationDelay: '0.4s'}} />
                            </div>
                            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wide">Analyzing</span>
                          </div>
                          <div className="text-xs text-zinc-200 leading-relaxed font-medium">
                            {agent.currentThought.length > 60 ? agent.currentThought.substring(0, 60) + '...' : agent.currentThought}
                          </div>
                        </div>
                      </foreignObject>
                    )}
                    
                  </g>
                );
              })}
              
              {/* Professional status legend - positioned to avoid overlap */}
              <foreignObject x="20" y="20" width="140" height="90" className="pointer-events-none">
                <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-2 border border-zinc-700/50 shadow-lg">
                  <div className="text-xs font-semibold text-white mb-2">Agent Status</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      <span className="text-xs text-zinc-300">Idle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="text-xs text-zinc-300">Analyzing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                      <span className="text-xs text-zinc-300">Computing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-xs text-zinc-300">Communicating</span>
                    </div>
                  </div>
                </div>
              </foreignObject>
              
              {/* Enhanced system analytics - positioned to avoid overlap */}
              <foreignObject x="500" y="20" width="160" height="120" className="pointer-events-none">
                <div className="bg-zinc-900/95 backdrop-blur-sm rounded-lg p-3 border border-zinc-700/50 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-300">Performance</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-zinc-400">
                      Active: {agents.filter(a => a.status !== 'idle').length}/{agents.length}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Total Requests: {agents.reduce((sum, a) => sum + a.totalRequests, 0)}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Success Rate: {(() => {
                        const total = agents.reduce((sum, a) => sum + a.totalRequests, 0);
                        const success = agents.reduce((sum, a) => sum + a.successCount, 0);
                        return total > 0 ? Math.round((success / total) * 100) : 0;
                      })()}%
                    </div>
                    <div className="text-xs text-zinc-400">
                      Avg Latency: {agents.length > 0 ? (agents.reduce((sum, a) => sum + a.latency, 0) / agents.length).toFixed(1) : 0}ms
                    </div>
                    <div className="text-xs text-zinc-400">
                      Health: {(() => {
                        const healths = agents.map(a => a.systemHealth);
                        if (healths.includes('critical')) return 'Critical';
                        if (healths.includes('warning')) return 'Warning';
                        if (healths.includes('good')) return 'Good';
                        return 'Excellent';
                      })()}
                    </div>
                  </div>
                </div>
              </foreignObject>
            </svg>
            
            {/* Selected Agent Details Panel */}
            {selectedAgent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-3 left-3 right-3 bg-zinc-900/95 backdrop-blur-sm rounded-lg p-4 border border-zinc-700/50 shadow-xl"
              >
                {(() => {
                  const agent = agents.find(a => a.id === selectedAgent);
                  if (!agent) return null;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${agent.color} shadow-lg`}>
                            {agent.icon}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white">{agent.name}</h4>
                            <p className="text-sm text-zinc-400">{agent.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedAgent(null)}
                          className="text-zinc-400 hover:text-white transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Enhanced metrics grid */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium text-zinc-300 mb-2">Status & Health</div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{backgroundColor: getStatusColor(agent.status)}} />
                              <span className="text-sm text-zinc-200 capitalize">{agent.status}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                agent.systemHealth === 'excellent' ? 'bg-green-400' :
                                agent.systemHealth === 'good' ? 'bg-blue-400' :
                                agent.systemHealth === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                              }`} />
                              <span className="text-sm text-zinc-200 capitalize">{agent.systemHealth}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-300 mb-2">Performance</div>
                          <div className="space-y-1">
                            <div className="text-sm text-zinc-200">
                              Confidence: {Math.round(agent.confidence * 100)}%
                            </div>
                            <div className="text-sm text-zinc-200">
                              Success Rate: {agent.totalRequests > 0 ? Math.round((agent.successCount / agent.totalRequests) * 100) : 0}%
                            </div>
                            <div className="text-sm text-zinc-200">
                              Avg Response: {agent.averageResponseTime.toFixed(1)}ms
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Resource Utilization */}
                      <div className="mb-4">
                        <div className="text-sm font-medium text-zinc-300 mb-3">Resource Utilization</div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-zinc-300">CPU Usage</span>
                              <span className="text-sm text-zinc-400">{agent.resourceUtilization.cpu}%</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-700 rounded-full">
                              <div 
                                className="h-full bg-blue-400 rounded-full transition-all duration-500"
                                style={{width: `${agent.resourceUtilization.cpu}%`}}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-zinc-300">Memory Usage</span>
                              <span className="text-sm text-zinc-400">{agent.resourceUtilization.memory}%</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-700 rounded-full">
                              <div 
                                className="h-full bg-green-400 rounded-full transition-all duration-500"
                                style={{width: `${agent.resourceUtilization.memory}%`}}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-zinc-300">Network Usage</span>
                              <span className="text-sm text-zinc-400">{agent.resourceUtilization.network}%</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-700 rounded-full">
                              <div 
                                className="h-full bg-purple-400 rounded-full transition-all duration-500"
                                style={{width: `${agent.resourceUtilization.network}%`}}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* System Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm font-medium text-zinc-300 mb-2">System Metrics</div>
                          <div className="space-y-1">
                            <div className="text-sm text-zinc-200">
                              Total Requests: {agent.totalRequests}
                            </div>
                            <div className="text-sm text-zinc-200">
                              Success Count: {agent.successCount}
                            </div>
                            <div className="text-sm text-zinc-200">
                              Error Count: {agent.errorCount}
                            </div>
                            <div className="text-sm text-zinc-200">
                              Active Connections: {agent.activeConnections}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-300 mb-2">Network</div>
                          <div className="space-y-1">
                            <div className="text-sm text-zinc-200">
                              Throughput: {agent.throughput.toFixed(1)} req/s
                            </div>
                            <div className="text-sm text-zinc-200">
                              Latency: {agent.latency.toFixed(1)}ms
                            </div>
                            <div className="text-sm text-zinc-200">
                              Messages: {agent.messageCount}
                            </div>
                            <div className="text-sm text-zinc-200">
                              Connections: {agent.connections.length}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Current Task and Progress */}
                      {agent.currentTask && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-zinc-300 mb-2">Current Task</div>
                          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30">
                            <div className="text-sm text-zinc-200 leading-relaxed mb-2">{agent.currentTask}</div>
                            {agent.taskProgress !== undefined && (
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-zinc-400">Progress</span>
                                  <span className="text-xs text-zinc-400">{agent.taskProgress}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-700 rounded-full">
                                  <div 
                                    className="h-full bg-blue-400 rounded-full transition-all duration-500"
                                    style={{width: `${agent.taskProgress}%`}}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Thinking Steps */}
                      {agent.thinkingSteps.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-zinc-300 mb-2">Thinking Process</div>
                          <div className="space-y-2">
                            {agent.thinkingSteps.map((step, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                <div className="text-xs text-zinc-300 leading-relaxed">{step}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Current Processing */}
                      {agent.currentThought && (
                        <div>
                          <div className="text-sm font-medium text-zinc-300 mb-2">Current Processing</div>
                          <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/30">
                            <div className="text-sm text-zinc-200 leading-relaxed">{agent.currentThought}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Error Information */}
                      {agent.lastError && (
                        <div>
                          <div className="text-sm font-medium text-zinc-300 mb-2">Last Error</div>
                          <div className="bg-red-900/20 rounded-lg p-3 border border-red-700/30">
                            <div className="text-sm text-red-200 leading-relaxed">{agent.lastError}</div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-sm font-medium text-zinc-300 mb-2">Connected Agents</div>
                        <div className="flex flex-wrap gap-2">
                          {agent.connections.map((connId) => {
                            const connAgent = agents.find(a => a.id === connId);
                            return (
                              <span
                                key={connId}
                                className="px-3 py-1 bg-zinc-800/50 rounded-lg text-sm font-medium text-zinc-200 border border-zinc-700/50"
                              >
                                {connAgent?.name.split(' ')[0]}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </motion.div>
        )}

        {view === "timeline" && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {messages.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <MessageSquare className="size-12 mx-auto mb-4 text-zinc-600" />
                <div className="text-lg font-medium mb-2">No Chess AI Activity</div>
                <div className="text-sm text-zinc-500">Start the AI system to see agent communications</div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.slice(-10).reverse().map((message) => {
                  const fromAgent = agents.find(a => a.id === message.from);
                  const toAgent = agents.find(a => a.id === message.to);
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4 p-4 bg-gradient-to-r from-zinc-900/50 to-zinc-950/50 rounded-xl border border-zinc-700/30 hover:border-zinc-600/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          message.type === 'thought' ? 'bg-blue-400' :
                          message.type === 'action' ? 'bg-green-400' :
                          message.type === 'query' ? 'bg-orange-400' : 'bg-purple-400'
                        }`} />
                        <div className="text-sm font-medium text-zinc-300">
                          {fromAgent?.name.split(' ')[0]} → {toAgent?.name.split(' ')[0]}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-zinc-200 leading-relaxed mb-2">{message.content}</div>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          <span>
                            <TimeDisplay timestamp={message.timestamp.getTime()} />
                          </span>
                          <span>
                            Confidence: {Math.round(message.confidence * 100)}%
                          </span>
                          <span className="capitalize">
                            {message.type}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {view === "pipeline" && (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Chess Detection Pipeline</h3>
              <p className="text-sm text-zinc-400">Live processing steps and current board state</p>
            </div>

            {/* Simple 3-image layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Debug Image 1 */}
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="size-5 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">Debug Step 1</h4>
                </div>
                
                {debugImages.length >= 1 ? (
                  <div className="relative">
                    <img
                      src={`/api/debug-image?path=${encodeURIComponent(debugImages[debugImages.length - 2])}`}
                      alt="Debug step 1"
                      className="w-full h-64 object-cover rounded-lg border border-zinc-600/30"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-zinc-900/80 text-white text-xs px-2 py-1 rounded">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-zinc-500">
                    <Eye className="size-12 mx-auto mb-3 text-zinc-600" />
                    <div className="text-sm">No debug image available</div>
                  </div>
                )}
              </div>

              {/* Debug Image 2 */}
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="size-5 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">Debug Step 2</h4>
                </div>
                
                {debugImages.length >= 2 ? (
                  <div className="relative">
                    <img
                      src={`/api/debug-image?path=${encodeURIComponent(debugImages[debugImages.length - 1])}`}
                      alt="Debug step 2"
                      className="w-full h-64 object-cover rounded-lg border border-zinc-600/30"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-zinc-900/80 text-white text-xs px-2 py-1 rounded">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-zinc-500">
                    <Eye className="size-12 mx-auto mb-3 text-zinc-600" />
                    <div className="text-sm">No debug image available</div>
                  </div>
                )}
              </div>

              {/* Current Board */}
              <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="size-5 text-green-400" />
                  <h4 className="text-lg font-semibold text-white">Current Board</h4>
                </div>
                
                {currentBoard ? (
                  <div className="relative">
                    <div 
                      className="w-full h-64 bg-zinc-800/30 rounded-lg border border-zinc-600/30 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: currentBoard }}
                    />
                    <div className="absolute top-2 right-2 bg-zinc-900/80 text-white text-xs px-2 py-1 rounded">
                      Live
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-zinc-500">
                    <Target className="size-12 mx-auto mb-3 text-zinc-600" />
                    <div className="text-sm">No board data available</div>
                    <div className="text-xs text-zinc-600 mt-1">Connect to chess detection service</div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
