/**
 * Alerts Component
 * 
 * Displays anomalies, warnings, and provides quick actions for pipeline issues
 */

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  CheckCircle,
  ExternalLink,
  Flag,
  X,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";

interface Alert {
  id: string;
  frame_id: string;
  timestamp: number;
  type: string;
  severity: "warning" | "error" | "info";
  message: string;
  affected_cells?: string[];
  suggested_actions?: string[];
}

export function Alerts() {
  const { pipelineEvents, selection, setSelectedFrame, setSelectedCells } = useDashboardStore();

  // Extract all alerts from pipeline events
  const alerts = useMemo(() => {
    const allAlerts: Alert[] = [];

    const eventsToCheck = selection.time_window
      ? pipelineEvents.filter(
          (e) =>
            e.timestamp >= selection.time_window!.start_timestamp &&
            e.timestamp <= selection.time_window!.end_timestamp
        )
      : pipelineEvents;

    eventsToCheck.forEach((event) => {
      if (event.anomalies) {
        event.anomalies.forEach((anomaly, idx) => {
          allAlerts.push({
            id: `${event.frame_id}_${idx}`,
            frame_id: event.frame_id,
            timestamp: event.timestamp,
            type: anomaly.type,
            severity: anomaly.severity,
            message: anomaly.message,
            affected_cells: anomaly.affected_cells,
            suggested_actions: getSuggestedActions(anomaly.type),
          });
        });
      }
    });

    // Sort by timestamp descending (most recent first)
    return allAlerts.sort((a, b) => b.timestamp - a.timestamp);
  }, [pipelineEvents, selection.time_window]);

  const alertCounts = useMemo(() => {
    const counts = { error: 0, warning: 0, info: 0 };
    alerts.forEach((alert) => {
      counts[alert.severity]++;
    });
    return counts;
  }, [alerts]);

  const handleJumpToFrame = (frameId: string, cells?: string[]) => {
    setSelectedFrame(frameId);
    if (cells) {
      setSelectedCells(cells);
    }
  };

  return (
    <Card className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold text-lg">Alerts & Anomalies</h3>
          </div>

          {/* Summary Badges */}
          <div className="flex items-center gap-2">
            {alertCounts.error > 0 && (
              <Badge variant="outline" className="border-red-500/50 bg-red-500/10">
                <XCircle className="h-3 w-3 mr-1" />
                {alertCounts.error} errors
              </Badge>
            )}
            {alertCounts.warning > 0 && (
              <Badge variant="outline" className="border-yellow-500/50 bg-yellow-500/10">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {alertCounts.warning} warnings
              </Badge>
            )}
            {alertCounts.info > 0 && (
              <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10">
                <AlertCircle className="h-3 w-3 mr-1" />
                {alertCounts.info} info
              </Badge>
            )}
          </div>
        </div>

        {selection.time_window && (
          <p className="text-xs text-muted-foreground">
            Showing alerts in selected time window
          </p>
        )}
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
            <p className="text-sm font-medium">All Clear!</p>
            <p className="text-xs mt-1">No anomalies detected</p>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onJumpToFrame={handleJumpToFrame}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Stats Footer */}
      {alerts.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>Total: {alerts.length} alerts</div>
            <div className="flex items-center gap-4">
              <span>
                Most recent:{" "}
                {new Date(alerts[0].timestamp).toLocaleTimeString()}
              </span>
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function AlertCard({
  alert,
  onJumpToFrame,
}: {
  alert: Alert;
  onJumpToFrame: (frameId: string, cells?: string[]) => void;
}) {
  const severityConfig = {
    error: {
      icon: <XCircle className="h-4 w-4" />,
      color: "border-red-500/50 bg-red-500/5",
      iconColor: "text-red-500",
      badge: "border-red-500/50 bg-red-500/10",
    },
    warning: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "border-yellow-500/50 bg-yellow-500/5",
      iconColor: "text-yellow-500",
      badge: "border-yellow-500/50 bg-yellow-500/10",
    },
    info: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: "border-blue-500/50 bg-blue-500/5",
      iconColor: "text-blue-500",
      badge: "border-blue-500/50 bg-blue-500/10",
    },
  };

  const config = severityConfig[alert.severity];

  return (
    <Card className={`p-4 ${config.color} border transition-all hover:shadow-md`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${config.iconColor}`}>{config.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`text-xs ${config.badge}`}>
              {alert.type.replace(/_/g, " ")}
            </Badge>
            <span className="text-[10px] text-muted-foreground font-mono">
              {new Date(alert.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Message */}
          <p className="text-sm mb-2">{alert.message}</p>

          {/* Affected Cells */}
          {alert.affected_cells && alert.affected_cells.length > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <span className="text-xs text-muted-foreground">Affected cells:</span>
              <div className="flex flex-wrap gap-1">
                {alert.affected_cells.map((cell) => (
                  <Badge key={cell} variant="secondary" className="text-[10px] font-mono">
                    {cell}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onJumpToFrame(alert.frame_id, alert.affected_cells)}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Jump to Frame
            </Button>

            {alert.suggested_actions && alert.suggested_actions.length > 0 && (
              <div className="flex items-center gap-2">
                {alert.suggested_actions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    {getActionIcon(action)}
                    {action}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function getSuggestedActions(type: string): string[] {
  switch (type) {
    case "low_confidence":
      return ["Reprocess", "Flag for Review"];
    case "illegal_move":
      return ["Validate Again", "Override"];
    case "corner_drift":
      return ["Recalibrate", "Reset Corners"];
    case "exposure_change":
      return ["Adjust Exposure", "Ignore"];
    default:
      return ["Flag", "Ignore"];
  }
}

function getActionIcon(action: string) {
  const iconMap: Record<string, React.ReactNode> = {
    Reprocess: <RefreshCw className="h-3 w-3 mr-1" />,
    "Flag for Review": <Flag className="h-3 w-3 mr-1" />,
    "Validate Again": <CheckCircle className="h-3 w-3 mr-1" />,
    Override: <AlertTriangle className="h-3 w-3 mr-1" />,
    Recalibrate: <RefreshCw className="h-3 w-3 mr-1" />,
    "Reset Corners": <XCircle className="h-3 w-3 mr-1" />,
    "Adjust Exposure": <TrendingDown className="h-3 w-3 mr-1" />,
    Ignore: <X className="h-3 w-3 mr-1" />,
    Flag: <Flag className="h-3 w-3 mr-1" />,
  };
  return iconMap[action] || null;
}

