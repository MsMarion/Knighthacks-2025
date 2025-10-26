/**
 * Timeline Component
 * 
 * Multi-series chart showing pipeline metrics over time with brush/zoom
 */

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Brush,
} from "recharts";
import { useDashboardStore } from "../../store/dashboardStore";
import { generateMockPipelineEvents } from "../../lib/mockData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Target } from "lucide-react";

interface TimelineDataPoint {
  timestamp: number;
  latency: number;
  confidence: number;
  detections: number;
}

export function Timeline() {
  const { pipelineEvents, addPipelineEvent, setTimeWindow } = useDashboardStore();
  const [data, setData] = useState<TimelineDataPoint[]>([]);

  // Initialize with mock data and simulate live updates
  useEffect(() => {
    // Load initial mock data
    const initialEvents = generateMockPipelineEvents(300);
    initialEvents.forEach((event) => addPipelineEvent(event));

    // Simulate live updates (30 FPS = ~33ms per frame)
    const interval = setInterval(() => {
      const newEvent = generateMockPipelineEvents(1)[0];
      addPipelineEvent(newEvent);
    }, 33);

    return () => clearInterval(interval);
  }, [addPipelineEvent]);

  // Transform pipeline events into chart data
  useEffect(() => {
    const chartData: TimelineDataPoint[] = pipelineEvents.map((event) => {
      const totalLatency = event.stage_timings
        ? Object.values(event.stage_timings).reduce((sum, val) => sum + val, 0)
        : 0;

      const avgConfidence = event.cell_scores
        ? event.cell_scores.reduce((sum, cell) => sum + cell.top1_confidence, 0) /
          event.cell_scores.length
        : 0;

      const numDetections = event.cell_scores?.length || 0;

      return {
        timestamp: event.timestamp,
        latency: Number(totalLatency.toFixed(2)),
        confidence: Number((avgConfidence * 100).toFixed(1)),
        detections: numDetections,
      };
    });

    setData(chartData);
  }, [pipelineEvents]);

  const handleBrushChange = (brushData: any) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      const start = data[brushData.startIndex]?.timestamp;
      const end = data[brushData.endIndex]?.timestamp;
      if (start && end) {
        setTimeWindow(start, end);
      }
    }
  };

  const latestData = data[data.length - 1];

  return (
    <Card className="p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Pipeline Metrics</h3>
        </div>
        
        {/* Live Stats */}
        {latestData && (
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              <span className="font-mono text-xs">{latestData.latency}ms</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Target className="h-3 w-3" />
              <span className="font-mono text-xs">{latestData.confidence}%</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              <span className="font-mono text-xs">{latestData.detections}</span>
            </Badge>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            opacity={0.5}
          />

          <YAxis
            yAxisId="latency"
            orientation="left"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            opacity={0.5}
          />

          <YAxis
            yAxisId="confidence"
            orientation="right"
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            opacity={0.5}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelFormatter={(ts) => new Date(ts).toLocaleTimeString()}
            formatter={(value: any, name: string) => {
              if (name === "latency") return [`${value}ms`, "Latency"];
              if (name === "confidence") return [`${value}%`, "Confidence"];
              if (name === "detections") return [value, "Detections"];
              return [value, name];
            }}
          />

          <Area
            yAxisId="latency"
            type="monotone"
            dataKey="latency"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorLatency)"
          />

          <Area
            yAxisId="confidence"
            type="monotone"
            dataKey="confidence"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorConfidence)"
          />

          <Brush
            dataKey="timestamp"
            height={30}
            stroke="hsl(var(--primary))"
            fill="hsl(var(--muted))"
            onChange={handleBrushChange}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(var(--primary))" }} />
          <span className="text-muted-foreground">Latency (ms)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
          <span className="text-muted-foreground">Confidence (%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(217, 91%, 60%)" }} />
          <span className="text-muted-foreground">Detections</span>
        </div>
      </div>
    </Card>
  );
}
