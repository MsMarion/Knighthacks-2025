/**
 * Agent Observatory Component
 * 
 * Visualizes agent-to-agent communication in real-time with lane-based timeline
 */

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Eye,
  Brain,
  Gavel,
  Target,
  FileText,
  Wrench,
  User,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";
import { generateMockAgentEvents } from "../../lib/mockData";
import type { AgentEvent, AgentRole } from "../../types";

// Agent role icons and colors
const agentConfig: Record<AgentRole, { icon: React.ReactNode; color: string }> = {
  system: { icon: <Bot className="h-4 w-4" />, color: "bg-gray-500" },
  perception: { icon: <Eye className="h-4 w-4" />, color: "bg-blue-500" },
  "board-reconstruction": { icon: <Brain className="h-4 w-4" />, color: "bg-purple-500" },
  "rules-engine": { icon: <Gavel className="h-4 w-4" />, color: "bg-red-500" },
  "chess-engine": { icon: <Target className="h-4 w-4" />, color: "bg-green-500" },
  planner: { icon: <FileText className="h-4 w-4" />, color: "bg-yellow-500" },
  reporter: { icon: <FileText className="h-4 w-4" />, color: "bg-pink-500" },
  "tool-runner": { icon: <Wrench className="h-4 w-4" />, color: "bg-orange-500" },
  user: { icon: <User className="h-4 w-4" />, color: "bg-cyan-500" },
};

function AgentEventCard({ event }: { event: AgentEvent }) {
  const config = agentConfig[event.role] || agentConfig.system;

  const statusIcons = {
    idle: <Clock className="h-3 w-3" />,
    thinking: <Activity className="h-3 w-3 animate-pulse" />,
    calling_tool: <Activity className="h-3 w-3 animate-spin" />,
    waiting: <Clock className="h-3 w-3" />,
    error: <AlertCircle className="h-3 w-3" />,
    complete: <CheckCircle className="h-3 w-3" />,
  };

  return (
    <Card className="p-3 hover:shadow-md transition-all duration-200 cursor-pointer group">
      <div className="flex items-start gap-3">
        {/* Agent Avatar */}
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className={`${config.color} text-white`}>
            {config.icon}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm capitalize">{event.agent}</span>
            <Badge variant="outline" className="text-[10px] capitalize">
              {event.kind}
            </Badge>
            {event.status && (
              <div className="flex items-center gap-1 text-muted-foreground">
                {statusIcons[event.status]}
              </div>
            )}
          </div>

          {/* Message Content */}
          {event.content && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{event.content}</p>
          )}

          {/* Tool Call */}
          {event.tool && (
            <Badge variant="secondary" className="text-[10px] font-mono">
              {event.tool}()
            </Badge>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
            <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
            {event.latency_ms && <span>{event.latency_ms}ms</span>}
            {event.references?.frame_id && (
              <Badge variant="outline" className="text-[9px]">
                {event.references.frame_id.slice(-6)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AgentLane({ agentId, events }: { agentId: string; events: AgentEvent[] }) {
  const role = events[0]?.role || "system";
  const config = agentConfig[role] || agentConfig.system;

  return (
    <div className="space-y-2">
      {/* Lane Header */}
      <div className="sticky top-0 bg-background z-10 pb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className={`${config.color} text-white text-[10px]`}>
              {config.icon}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium capitalize">{agentId}</div>
            <div className="text-[10px] text-muted-foreground">{events.length} events</div>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="space-y-2 pl-8 border-l-2 border-muted">
        {events.map((event) => (
          <AgentEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export function AgentObservatory() {
  const { agentEvents, addAgentEvent, setAgentConnected } = useDashboardStore();
  const [groupedEvents, setGroupedEvents] = useState<Record<string, AgentEvent[]>>({});

  // Initialize with mock data and simulate live updates
  useEffect(() => {
    // Load initial mock data
    const initialEvents = generateMockAgentEvents(50);
    initialEvents.forEach((event) => addAgentEvent(event));

    // Mark agents as connected
    setAgentConnected(true);

    // Simulate live updates (~2 events per second)
    const interval = setInterval(() => {
      const newEvent = generateMockAgentEvents(1)[0];
      addAgentEvent(newEvent);
    }, 500);

    return () => clearInterval(interval);
  }, [addAgentEvent, setAgentConnected]);

  // Group events by agent
  useEffect(() => {
    const grouped: Record<string, AgentEvent[]> = {};
    agentEvents.forEach((event) => {
      if (!grouped[event.agent]) {
        grouped[event.agent] = [];
      }
      grouped[event.agent].push(event);
    });

    // Sort events within each agent by timestamp
    Object.keys(grouped).forEach((agent) => {
      grouped[agent].sort((a, b) => a.timestamp - b.timestamp);
    });

    setGroupedEvents(grouped);
  }, [agentEvents]);

  const agents = Object.keys(groupedEvents);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Agent Observatory</h3>
          </div>
          <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10">
            {agents.length} Agents
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Real-time agent communication timeline
        </p>
      </div>

      {/* Lanes */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {agents.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No agent activity yet</p>
              <p className="text-xs mt-1">Agent events will appear here when active</p>
            </div>
          ) : (
            agents.map((agentId, index) => (
              <div key={agentId}>
                <AgentLane agentId={agentId} events={groupedEvents[agentId]} />
                {index < agents.length - 1 && <Separator className="my-6" />}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
