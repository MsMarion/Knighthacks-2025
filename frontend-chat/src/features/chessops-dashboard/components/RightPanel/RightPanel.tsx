/**
 * Right Panel Component
 * 
 * Toggleable view between Chat and Agent Observatory
 */

import { useState } from "react";
import { MessageCircle, Activity } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { AgentObservatory } from "./AgentObservatory";

export function RightPanel() {
  const [activeView, setActiveView] = useState<"chat" | "agents">("chat");

  return (
    <div className="h-full flex flex-col">
      {/* Tab Switcher */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="flex">
          <button
            onClick={() => setActiveView("chat")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === "chat"
                ? "border-primary text-foreground bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </button>

          <button
            onClick={() => setActiveView("agents")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === "agents"
                ? "border-primary text-foreground bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Activity className="h-4 w-4" />
            Agents
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === "chat" ? <ChatPanel /> : <AgentObservatory />}
      </div>
    </div>
  );
}
