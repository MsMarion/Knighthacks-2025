/**
 * Chat Message Types
 * 
 * Types for the chat interface
 */

export type MessageRole = "user" | "assistant" | "system" | "tool";

export type MessageStatus = "pending" | "streaming" | "complete" | "error";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status: MessageStatus;
  tool?: string;
  tool_result?: any;
  citations?: string[];
  error?: {
    message: string;
    code?: string;
  };
}

export interface ChatTool {
  id: string;
  label: string;
  description: string;
  icon?: string;
  action: string; // The prompt/action to send
}
