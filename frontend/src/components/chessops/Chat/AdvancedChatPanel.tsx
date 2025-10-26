"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendToAgent, AgentRequest, initializeSession } from "@/lib/api";

function TimeDisplay({ timestamp }: { timestamp: number }) {
  const [timeString, setTimeString] = useState<string>("");
  
  useEffect(() => {
    setTimeString(new Date(timestamp).toLocaleTimeString());
  }, [timestamp]);
  
  return <span>{timeString}</span>;
}
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles, 
  MessageSquare, 
  Trash2,
  Settings,
  Zap,
  Brain,
  Network,
  Cpu
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  agent?: string;
  confidence?: number;
  isTyping?: boolean;
}

interface ChatEndpoint {
  name: string;
  url: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const CHAT_ENDPOINTS: ChatEndpoint[] = [
  {
    name: "adk",
    url: "http://localhost:8000/run",
    description: "Main ADK/A2A agent for general assistance",
    icon: <Brain className="size-4" />,
    color: "from-blue-500 to-cyan-500"
  },
  {
    name: "quantum_planner", 
    url: "http://localhost:8000/run",
    description: "Strategic planning and decision optimization",
    icon: <Network className="size-4" />,
    color: "from-purple-500 to-pink-500"
  },
  {
    name: "neural_worldview",
    url: "http://localhost:8000/run",
    description: "Context understanding and world modeling",
    icon: <Zap className="size-4" />,
    color: "from-emerald-500 to-teal-500"
  },
  {
    name: "cognitive_analyzer",
    url: "http://localhost:8000/run",
    description: "Deep analysis and pattern recognition",
    icon: <Cpu className="size-4" />,
    color: "from-orange-500 to-red-500"
  }
];

export function AdvancedChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      content: "Hello! I'm your A2A Agent Observatory assistant. I can connect you with our AI agents to help with chess analysis, game strategy, and board state recognition. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
      agent: "System",
      confidence: 1.0
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ChatEndpoint | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [userId] = useState(() => `u_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sessionId] = useState(() => `s_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: input.trim(),
      role: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // Initialize session if not already done
      if (!sessionInitialized) {
        const appName = selectedEndpoint?.name || "adk";
        const initialized = await initializeSession(userId, sessionId, appName);
        if (!initialized) {
          throw new Error("Failed to initialize session with the agent");
        }
        setSessionInitialized(true);
        console.log("Session initialized successfully");
      }

      // Send to ADK/A2A agent
      const agentRequest: AgentRequest = {
        app_name: selectedEndpoint?.name || "adk",
        user_id: userId,
        session_id: sessionId,
        new_message: {
          role: "user",
          parts: [{
            text: currentInput
          }]
        }
      };

      const response = await sendToAgent(agentRequest);
      
      const agentResponse: ChatMessage = {
        id: `agent-${Date.now()}`,
        content: response.response,
        role: "assistant",
        timestamp: new Date(),
        agent: response.agent || selectedEndpoint?.name || "System",
        confidence: response.confidence || 0.8,
        isTyping: false
      };

      setMessages(prev => [...prev, agentResponse]);
    } catch (error) {
      console.error("Failed to send message to agent:", error);
      
      let errorMessage = "Sorry, I encountered an error communicating with the agent.";
      
      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "Unable to connect to the agent server. Please make sure the ADK/A2A server is running on localhost:8000.";
        } else if (error.message.includes("Agent API error")) {
          errorMessage = `Agent API error: ${error.message}`;
        } else if (error.message.includes("Failed to initialize session")) {
          errorMessage = "Failed to initialize session with the agent. Please try again.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      const errorResponse: ChatMessage = {
        id: `error-${Date.now()}`,
        content: errorMessage,
        role: "assistant",
        timestamp: new Date(),
        agent: "System",
        confidence: 0.0,
        isTyping: false
      };

      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        content: "Chat cleared. How can I help you today?",
        role: "assistant",
        timestamp: new Date(),
        agent: "System",
        confidence: 1.0
      }
    ]);
    setSessionInitialized(false);
  };

  const handleEndpointChange = (endpoint: ChatEndpoint) => {
    setSelectedEndpoint(endpoint);
    setSessionInitialized(false); // Reset session when changing endpoint
  };

  return (
    <div className="rounded-2xl bg-zinc-950 shadow-soft ring-1 ring-white/10 flex flex-col h-80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <MessageSquare className="size-5 text-fuchsia-400" />
          <h3 className="font-semibold">A2A Chat Interface</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-lg p-1.5 hover:bg-zinc-800 transition-colors"
            title="Settings"
          >
            <Settings className="size-4" />
          </button>
          <button
            onClick={clearChat}
            className="rounded-lg p-1.5 hover:bg-zinc-800 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Agent Selection */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-white/10 p-4"
          >
            <div className="text-sm font-medium text-zinc-300 mb-3">Select Agent Endpoint</div>
            <div className="grid grid-cols-2 gap-2">
              {CHAT_ENDPOINTS.map((endpoint) => (
                <button
                  key={endpoint.name}
                  onClick={() => handleEndpointChange(endpoint)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedEndpoint?.name === endpoint.name
                      ? 'border-fuchsia-500/50 bg-fuchsia-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`p-1 rounded bg-gradient-to-r ${endpoint.color}`}>
                      {endpoint.icon}
                    </div>
                    <span className="text-xs font-medium">{endpoint.name}</span>
                  </div>
                  <div className="text-xs text-zinc-400">{endpoint.description}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role !== "user" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center">
                    <Bot className="size-4" />
                  </div>
                </div>
              )}
              
              <div className={`max-w-[80%] ${
                message.role === "user" ? "order-first" : ""
              }`}>
                <div className={`rounded-lg p-3 ${
                  message.role === "user" 
                    ? "bg-fuchsia-500/20 text-fuchsia-100" 
                    : "bg-zinc-800 text-zinc-100"
                }`}>
                  <div className="text-sm">{message.content}</div>
                  
                  {message.agent && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
                      <span>{message.agent}</span>
                      {message.confidence && (
                        <span>• {Math.round(message.confidence * 100)}% confidence</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-zinc-500 mt-1">
                  <TimeDisplay timestamp={message.timestamp.getTime()} />
                </div>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <User className="size-4" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500 flex items-center justify-center">
              <Bot className="size-4" />
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm text-zinc-400">
                  {!sessionInitialized 
                    ? "Initializing session..." 
                    : `${selectedEndpoint?.name || "System"} is thinking...`
                  }
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${selectedEndpoint?.name || "A2A System"}...`}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
              rows={1}
              style={{ minHeight: "40px", maxHeight: "120px" }}
            />
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="rounded-lg bg-fuchsia-500/20 px-4 py-2 text-sm font-medium hover:bg-fuchsia-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
        
        {selectedEndpoint && (
          <div className="mt-2 text-xs text-zinc-400">
            Connected to: <span className="text-fuchsia-400">{selectedEndpoint.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
