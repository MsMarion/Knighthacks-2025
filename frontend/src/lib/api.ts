const BASE = process.env.NEXT_PUBLIC_CHESS_API_URL || "http://127.0.0.1:8000";

export async function apiCurrentBoardSvg(): Promise<string> {
  const res = await fetch(`${BASE}/current_board`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch board SVG");
  return res.text();
}

export async function apiPredict(image: File, a1Pos: string) {
  const formData = new FormData();
  formData.append('image', image);
  formData.append('a1_pos', a1Pos);
  
  const res = await fetch(`${BASE}/predict`, { 
    method: "POST", 
    body: formData 
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ fen: string; board_ascii: string; board_svg: string }>;
}

export async function apiNextMove() {
  const res = await fetch(`${BASE}/nextmove`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    best_move: { uci: string; san: string; score?: string | null };
    new_fen: string;
    board_svg_with_move: string;
  }>;
}

export async function apiSetElo(elo: number) {
  const res = await fetch(`${BASE}/set_elo`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ elo })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiVisualizeNextMove(): Promise<string> {
  const res = await fetch(`${BASE}/visualize_next_move`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch next move visualization");
  return res.text();
}

export async function checkServerStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/`, { 
      method: "GET",
      signal: AbortSignal.timeout(5000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ADK/A2A Agent Communication
// This module handles communication with the ADK/A2A agent system
// The agent expects requests in the format specified by the curl command:
// curl -X POST http://localhost:8000/run -H "Content-Type: application/json" -d '{...}'

export interface AgentMessage {
  role: "user" | "assistant";
  parts: Array<{
    text: string;
  }>;
}

export interface AgentRequest {
  app_name: string;
  user_id: string;
  session_id: string;
  new_message: AgentMessage;
}

export interface AgentResponse {
  response: string;
  agent: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export async function initializeSession(userId: string, sessionId: string, appName: string): Promise<boolean> {
  try {
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_name: appName,
        user_id: userId,
        session_id: sessionId,
        action: "initialize"
      })
    });
    
    if (!res.ok) {
      console.error("Session initialization failed:", res.status, res.statusText);
      return false;
    }
    
    console.log("Session initialized successfully");
    return true;
  } catch (error) {
    console.error("Network error initializing session:", error);
    return false;
  }
}

export async function sendToAgent(request: AgentRequest): Promise<AgentResponse> {
  try {
    // Use Next.js API route as proxy to avoid CORS issues
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request)
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Agent API error response:", errorData);
      throw new Error(errorData.error || `Agent API error: ${res.status} ${res.statusText}`);
    }
    
    const response = await res.json();
    console.log("Agent API response:", response);
    return response;
  } catch (error) {
    console.error("Network error calling agent API:", error);
    throw error;
  }
}