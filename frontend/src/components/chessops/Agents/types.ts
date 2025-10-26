export type AgentEvent = {
  id: string; 
  ts: number;
  agent: string; 
  kind: "message"|"tool_call"|"tool_result"|"status";
  parent?: string; 
  latency?: number; 
  refs?: { frameId?: string; cell?: string };
  summary?: string; 
  status?: "running"|"waiting"|"error"|"done";
};
