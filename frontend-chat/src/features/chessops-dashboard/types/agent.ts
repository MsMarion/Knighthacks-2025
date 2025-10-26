/**
 * Agent Event Types
 * 
 * REPO-UNKNOWN: No agent orchestration system exists in codebase yet.
 * This defines the expected schema for future A2A events.
 */

export type AgentRole =
  | "system"
  | "perception"
  | "board-reconstruction"
  | "rules-engine"
  | "chess-engine"
  | "planner"
  | "reporter"
  | "tool-runner"
  | "user";

export type AgentEventKind = "message" | "tool_call" | "tool_result" | "status";

export type AgentStatus = "idle" | "thinking" | "calling_tool" | "waiting" | "error" | "complete";

export interface AgentEvent {
  id: string;
  timestamp: number;
  agent: string; // Agent identifier
  role: AgentRole;
  kind: AgentEventKind;
  status?: AgentStatus;
  
  // Message content
  content?: string;
  
  // Tool call details
  tool?: string;
  args?: Record<string, any>;
  result?: any;
  
  // Graph structure
  parent_id?: string; // For threading/causality
  thread_id?: string; // Conversation thread
  
  // Cross-linking to pipeline
  references?: {
    frame_id?: string;
    cells?: string[];
  };
  
  // Performance
  latency_ms?: number;
  
  // Error handling
  error?: {
    message: string;
    code?: string;
    retry_count?: number;
  };
}

/**
 * Agent metadata for visualization
 */
export interface AgentMetadata {
  id: string;
  role: AgentRole;
  label: string;
  description?: string;
  avatar?: string;
  color?: string; // For graph visualization
  status: AgentStatus;
  message_count?: number;
  tool_call_count?: number;
}

/**
 * Conversation thread summary
 */
export interface ConversationThread {
  thread_id: string;
  label: string;
  agents: string[]; // Agent IDs involved
  event_count: number;
  start_timestamp: number;
  end_timestamp?: number;
  status: "active" | "complete" | "error";
}

/**
 * Agent-to-agent edge for graph visualization
 */
export interface AgentEdge {
  from_agent: string;
  to_agent: string;
  event_id: string;
  kind: AgentEventKind;
  timestamp: number;
  weight?: number; // For edge thickness
}

