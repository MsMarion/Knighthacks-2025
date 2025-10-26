/**
 * Debug Workbench Component
 * 
 * Central debugging interface with timeline and tabbed detail views
 */

import { Tabs } from "@/components/ui/tabs";
import { useDashboardStore } from "../../store/dashboardStore";
import { Timeline } from "./Timeline";
import { ScoresTable } from "./ScoresTable";
import { PipelineStepper } from "./PipelineStepper";
import { Heatmaps } from "./Heatmaps";
import { Boardstate } from "./Boardstate";
import { Alerts } from "./Alerts";
import { FileCode, Table, Grid3x3, CheckSquare, AlertTriangle } from "lucide-react";

export function DebugWorkbench() {
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      {/* Timeline */}
      <div className="flex-shrink-0">
        <Timeline />
      </div>

      {/* Tabbed Detail Views */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Tab List */}
          <div className="flex-shrink-0 border-b">
            <div className="flex gap-4 px-1">
              <button
                onClick={() => setActiveTab("pipeline")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "pipeline"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                <FileCode className="h-4 w-4" />
                Pipeline
              </button>

              <button
                onClick={() => setActiveTab("scores")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "scores"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                <Table className="h-4 w-4" />
                Scores
              </button>

              <button
                onClick={() => setActiveTab("heatmaps")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "heatmaps"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                <Grid3x3 className="h-4 w-4" />
                Heatmaps
              </button>

              <button
                onClick={() => setActiveTab("boardstate")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "boardstate"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                Boardstate
              </button>

              <button
                onClick={() => setActiveTab("alerts")}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "alerts"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                Alerts
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden mt-4">
            {activeTab === "pipeline" && (
              <div className="h-full overflow-y-auto">
                <PipelineStepper />
              </div>
            )}

            {activeTab === "scores" && (
              <div className="h-full">
                <ScoresTable />
              </div>
            )}

            {activeTab === "heatmaps" && (
              <div className="h-full overflow-y-auto">
                <Heatmaps />
              </div>
            )}
            
            {activeTab === "boardstate" && (
              <div className="h-full overflow-y-auto">
                <Boardstate />
              </div>
            )}
            
            {activeTab === "alerts" && (
              <div className="h-full overflow-y-auto">
                <Alerts />
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
