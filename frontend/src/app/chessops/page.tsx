"use client";

import { useEffect } from "react";
import { TopBar } from "@/components/chessops/TopBar";
import { CameraWall } from "@/components/chessops/CameraWall";
import { DebugWorkbench } from "@/components/chessops/DebugWorkbench/PipelineTabs";
import { AgentObservatory } from "@/components/chessops/Agents/AgentObservatory";
import { ChatPanel } from "@/components/chessops/Chat/ChatPanel";
import { CameraInitializer } from "@/components/chessops/CameraInitializer";
import { featureEnabled } from "@/lib/featureFlags";

export default function ChessOpsPage() {
  useEffect(() => {
    if (!featureEnabled("CHESSOPS")) console.warn("ChessOps flag disabled.");
  }, []);

  return (
    <div className="flex h-dvh flex-col">
      <CameraInitializer />
      <TopBar />
      {/* Main content area with proper layout */}
      <div className="flex-1 grid grid-rows-[60%_40%] gap-3 p-3 overflow-hidden">
        {/* Top row: Cameras (left) + A2A Agents (right) */}
        <div className="grid grid-cols-12 gap-3 h-full">
          <div className="col-span-3 h-full overflow-auto">
            <CameraWall />
          </div>
          <div className="col-span-9 h-full overflow-auto">
            <AgentObservatory />
          </div>
        </div>

        {/* Bottom row: Pipeline (75% left) + Chat (25% right) */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-9 overflow-auto">
            <DebugWorkbench />
          </div>
          <div className="col-span-3 overflow-auto">
            <ChatPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
