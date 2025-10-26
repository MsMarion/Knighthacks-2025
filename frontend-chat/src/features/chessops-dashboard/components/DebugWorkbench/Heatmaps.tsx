/**
 * Heatmaps Component
 * 
 * Board-shaped heatmap visualizations for confidence, presence, and change detection
 */

import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Grid3x3, TrendingUp, Activity, AlertTriangle } from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";

type HeatmapMode = "confidence" | "presence" | "change";

interface CellData {
  cell: string;
  value: number; // 0-1
  label: string;
}

export function Heatmaps() {
  const { pipelineEvents, selection, setHoveredCell, setSelectedCells } = useDashboardStore();
  const [mode, setMode] = React.useState<HeatmapMode>("confidence");

  // Get the selected frame or the latest frame
  const selectedEvent = selection.selected_frame_id
    ? pipelineEvents.find((e) => e.frame_id === selection.selected_frame_id)
    : pipelineEvents[pipelineEvents.length - 1];

  // Build heatmap data
  const heatmapData = useMemo(() => {
    if (!selectedEvent?.cell_scores) return [];

    const data: CellData[] = [];
    
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    for (const rank of ranks.reverse()) {
      for (const file of files) {
        const cell = `${file}${rank}`;
        const score = selectedEvent.cell_scores.find(s => s.cell === cell);

        let value = 0;
        let label = cell;

        if (score) {
          if (mode === "confidence") {
            value = score.top1_confidence;
            label = `${cell}: ${(score.top1_confidence * 100).toFixed(1)}%`;
          } else if (mode === "presence") {
            value = score.top1_class !== "0" ? 1 : 0;
            label = `${cell}: ${score.top1_class !== "0" ? "occupied" : "empty"}`;
          } else if (mode === "change") {
            value = score.delta_vs_previous || 0;
            label = `${cell}: Δ ${(score.delta_vs_previous || 0).toFixed(2)}`;
          }
        }

        data.push({ cell, value, label });
      }
    }

    return data;
  }, [selectedEvent, mode]);

  // Color scale based on value
  const getColor = (value: number, mode: HeatmapMode) => {
    if (mode === "presence") {
      return value > 0 ? "rgb(34, 197, 94)" : "rgb(100, 116, 139)";
    }

    // Confidence / change: gradient from red -> yellow -> green
    if (value < 0.5) {
      const t = value * 2;
      return `rgb(${255}, ${Math.floor(99 + t * 156)}, ${Math.floor(71 * t)})`;
    } else {
      const t = (value - 0.5) * 2;
      return `rgb(${Math.floor(255 - 221 * t)}, ${Math.floor(255 - 58 * t)}, ${Math.floor(71 - 37 * t)})`;
    }
  };

  const modeIcons = {
    confidence: <TrendingUp className="h-4 w-4" />,
    presence: <Grid3x3 className="h-4 w-4" />,
    change: <Activity className="h-4 w-4" />,
  };

  const modeLabels = {
    confidence: "Confidence",
    presence: "Presence",
    change: "Change",
  };

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg">Board Heatmap</h3>
          <p className="text-xs text-muted-foreground">
            {selectedEvent
              ? `Frame ${selectedEvent.frame_id.slice(-8)}`
              : "No frame selected"}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2">
          {(Object.keys(modeLabels) as HeatmapMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                mode === m
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {modeIcons[m]}
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="flex-1 flex items-center justify-center">
        {heatmapData.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <Grid3x3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No data available</p>
            <p className="text-xs mt-1">Select a frame with cell scores</p>
          </div>
        ) : (
          <div className="relative w-full max-w-2xl">
            {/* Board Grid */}
            <div className="grid grid-cols-8 gap-1 p-4 bg-muted/30 rounded-xl border-2 border-border">
              {heatmapData.map((cell) => (
                <div
                  key={cell.cell}
                  className="relative aspect-square rounded transition-all duration-300 cursor-pointer hover:scale-110 hover:z-10 hover:shadow-2xl group"
                  style={{
                    backgroundColor: getColor(cell.value, mode),
                    opacity: selection.hovered_cell === cell.cell ? 1 : 0.85,
                  }}
                  onMouseEnter={() => setHoveredCell(cell.cell)}
                  onMouseLeave={() => setHoveredCell(undefined)}
                  onClick={() => setSelectedCells([cell.cell])}
                  title={cell.label}
                >
                  {/* Cell Label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-[10px] font-bold opacity-70 group-hover:opacity-100 transition-opacity"
                      style={{
                        color: cell.value > 0.5 ? "white" : "rgba(0,0,0,0.7)",
                      }}
                    >
                      {cell.cell}
                    </span>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg whitespace-nowrap z-20 border">
                    {cell.label}
                  </div>

                  {/* Selection Indicator */}
                  {selection.selected_cells?.includes(cell.cell) && (
                    <div className="absolute inset-0 border-4 border-primary rounded animate-pulse" />
                  )}
                </div>
              ))}
            </div>

            {/* Rank Labels (Left) */}
            <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-around mr-2 text-xs font-mono text-muted-foreground">
              {['8', '7', '6', '5', '4', '3', '2', '1'].map((rank) => (
                <div key={rank} className="flex items-center justify-end pr-2">
                  {rank}
                </div>
              ))}
            </div>

            {/* File Labels (Bottom) */}
            <div className="flex justify-around mt-2 text-xs font-mono text-muted-foreground">
              {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file) => (
                <div key={file}>{file}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {heatmapData.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">Color Scale</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-16 h-3 rounded" style={{
                  background: mode === "presence"
                    ? "linear-gradient(to right, rgb(100, 116, 139), rgb(34, 197, 94))"
                    : "linear-gradient(to right, rgb(239, 68, 68), rgb(234, 179, 8), rgb(34, 197, 94))"
                }} />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{mode === "presence" ? "Empty" : "Low"}</span>
                  <span>→</span>
                  <span>{mode === "presence" ? "Occupied" : "High"}</span>
                </div>
              </div>

              {selectedEvent?.anomalies && selectedEvent.anomalies.length > 0 && (
                <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {selectedEvent.anomalies.length} anomalies
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

