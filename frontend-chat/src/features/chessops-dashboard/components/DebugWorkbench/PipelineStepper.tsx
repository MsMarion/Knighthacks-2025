/**
 * Pipeline Stepper Component
 * 
 * Visual representation of the chess detection pipeline stages
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Image as ImageIcon,
  Grid3x3,
  Crop,
  Brain,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  status: "idle" | "processing" | "complete" | "error";
  timing_ms?: number;
}

export function PipelineStepper() {
  const { pipelineEvents, selection } = useDashboardStore();

  // Get the selected frame or the latest frame
  const selectedEvent = selection.selected_frame_id
    ? pipelineEvents.find((e) => e.frame_id === selection.selected_frame_id)
    : pipelineEvents[pipelineEvents.length - 1];

  // Define pipeline stages
  const stages: PipelineStage[] = [
    {
      id: "raw",
      label: "Raw Frame",
      icon: <ImageIcon className="h-5 w-5" />,
      description: "Original camera input",
      status: selectedEvent ? "complete" : "idle",
      timing_ms: selectedEvent?.stage_timings?.preprocess_ms,
    },
    {
      id: "board_detect",
      label: "Board Detection",
      icon: <Grid3x3 className="h-5 w-5" />,
      description: "Locate board corners",
      status: selectedEvent ? "complete" : "idle",
      timing_ms: selectedEvent?.stage_timings?.board_detect_ms,
    },
    {
      id: "grid_fit",
      label: "Grid Fitting",
      icon: <Grid3x3 className="h-5 w-5" />,
      description: "Warp to square view",
      status: selectedEvent ? "complete" : "idle",
      timing_ms: selectedEvent?.stage_timings?.grid_fit_ms,
    },
    {
      id: "crop",
      label: "Cell Cropping",
      icon: <Crop className="h-5 w-5" />,
      description: "Extract 64 cells",
      status: selectedEvent ? "complete" : "idle",
      timing_ms: selectedEvent?.stage_timings?.crop_ms,
    },
    {
      id: "classify",
      label: "Classification",
      icon: <Brain className="h-5 w-5" />,
      description: "Identify pieces",
      status: selectedEvent ? "complete" : "idle",
      timing_ms: selectedEvent?.stage_timings?.classify_ms,
    },
    {
      id: "validate",
      label: "Validation",
      icon: <CheckCircle className="h-5 w-5" />,
      description: "Generate FEN",
      status: selectedEvent?.accepted_board_state ? "complete" : "idle",
      timing_ms: selectedEvent?.stage_timings?.postprocess_ms,
    },
  ];

  const statusColors = {
    idle: "bg-muted text-muted-foreground border-muted",
    processing: "bg-blue-500/20 text-blue-500 border-blue-500/50 animate-pulse",
    complete: "bg-green-500/20 text-green-500 border-green-500/50",
    error: "bg-red-500/20 text-red-500 border-red-500/50",
  };

  return (
    <Card className="p-6 transition-all duration-300 hover:shadow-lg">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">Pipeline Stages</h3>
        <p className="text-xs text-muted-foreground">
          {selectedEvent
            ? `Frame ${selectedEvent.frame_id.slice(-8)}`
            : "No frame selected"}
        </p>
      </div>

      {/* Stages */}
      <div className="flex items-start gap-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center flex-1">
            {/* Stage Card */}
            <div className="flex-1">
              <Card
                className={`p-4 border-2 transition-all duration-300 ${statusColors[stage.status]} hover:scale-105 cursor-pointer`}
              >
                <div className="flex flex-col items-center gap-2">
                  {/* Icon */}
                  <div className={`${stage.status === "complete" ? "animate-bounce-once" : ""}`}>
                    {stage.icon}
                  </div>

                  {/* Label */}
                  <div className="text-center">
                    <div className="font-medium text-sm">{stage.label}</div>
                    <div className="text-xs opacity-70">{stage.description}</div>
                  </div>

                  {/* Timing */}
                  {stage.timing_ms !== undefined && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-current/30"
                    >
                      {stage.timing_ms.toFixed(1)}ms
                    </Badge>
                  )}

                  {/* Preview Placeholder */}
                  {stage.status === "complete" && (
                    <div className="w-full mt-2">
                      <Skeleton className="w-full h-16 rounded" />
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Arrow */}
            {index < stages.length - 1 && (
              <div className="px-2 flex items-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Stats */}
      {selectedEvent && (
        <div className="mt-6 pt-6 border-t flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Total Latency</div>
              <div className="text-lg font-mono font-semibold">
                {selectedEvent.stage_timings
                  ? Object.values(selectedEvent.stage_timings)
                      .reduce((sum, val) => sum + val, 0)
                      .toFixed(2)
                  : "—"}
                ms
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Detections</div>
              <div className="text-lg font-mono font-semibold">
                {selectedEvent.cell_scores?.length || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Avg Confidence</div>
              <div className="text-lg font-mono font-semibold">
                {selectedEvent.cell_scores
                  ? (
                      (selectedEvent.cell_scores.reduce(
                        (sum, cell) => sum + cell.top1_confidence,
                        0
                      ) /
                        selectedEvent.cell_scores.length) *
                      100
                    ).toFixed(1)
                  : "—"}
                %
              </div>
            </div>
          </div>

          {selectedEvent.accepted_board_state && (
            <Badge variant="outline" className="border-green-500/50 bg-green-500/10">
              FEN: {selectedEvent.accepted_board_state.fen.split(" ")[0]}
            </Badge>
          )}
        </div>
      )}
    </Card>
  );
}
