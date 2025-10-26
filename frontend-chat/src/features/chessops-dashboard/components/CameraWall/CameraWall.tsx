/**
 * Camera Wall Component
 * 
 * Displays dual camera feeds with overlays, controls, and health indicators
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Pause,
  Camera,
  Maximize,
  Download,
  Circle,
  Grid3x3,
  Eye,
  Activity,
} from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";
import { mockCameraFeeds } from "../../lib/mockData";

interface CameraFeedProps {
  id: string;
  label: string;
  url?: string;
  health: "connecting" | "connected" | "buffering" | "error" | "disconnected";
  fps?: number;
  latency_ms?: number;
  resolution?: { width: number; height: number };
}

function CameraFeedDisplay({ id, label, health, fps, latency_ms, resolution }: CameraFeedProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

  const healthColors = {
    connecting: "border-yellow-500/50 bg-yellow-500/10",
    connected: "border-green-500/50 bg-green-500/10",
    buffering: "border-blue-500/50 bg-blue-500/10",
    error: "border-red-500/50 bg-red-500/10",
    disconnected: "border-gray-500/50 bg-gray-500/10",
  };

  const healthIcon = {
    connecting: <Activity className="h-3 w-3 animate-pulse" />,
    connected: <Circle className="h-3 w-3 fill-current" />,
    buffering: <Activity className="h-3 w-3 animate-spin" />,
    error: <Circle className="h-3 w-3" />,
    disconnected: <Circle className="h-3 w-3" />,
  };

  return (
    <Card className="relative overflow-hidden group transition-all duration-300 hover:ring-2 hover:ring-primary hover:shadow-2xl hover:scale-[1.02]">
      {/* Video Container */}
      <div className="relative aspect-video bg-gradient-to-br from-muted via-background to-muted flex items-center justify-center">
        {/* Loading State */}
        {health === "connecting" && (
          <div className="absolute inset-0">
            <Skeleton className="w-full h-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="h-12 w-12 animate-pulse text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Placeholder Feed (Static Image) */}
        {health === "connected" && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted flex items-center justify-center animate-fade-in">
            {/* Animated camera icon */}
            <div className="relative">
              <Camera className="h-24 w-24 text-muted-foreground/30 animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse-ring" />
            </div>
            
            {/* Stream simulation overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
            
            {/* Label with better styling */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border">
              <span className="text-xs text-muted-foreground font-mono">
                {id === "robot-arm" ? "Robot Arm Camera" : "Top-Down Board View"}
              </span>
            </div>
          </div>
        )}

        {/* Overlay */}
        {showOverlay && health === "connected" && (
          <div className="absolute inset-0 pointer-events-none animate-fade-in">
            {/* Grid Overlay */}
            <svg className="w-full h-full opacity-40">
              <defs>
                <pattern
                  id={`grid-${id}`}
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-primary"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
            </svg>

            {/* Corner Markers (for top-down board) */}
            {id === "top-down" && (
              <>
                <div className="absolute top-12 left-12">
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 bg-primary rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-primary/50 rounded-full animate-pulse-ring" />
                  </div>
                </div>
                <div className="absolute top-12 right-12">
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 bg-primary rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-primary/50 rounded-full animate-pulse-ring" />
                  </div>
                </div>
                <div className="absolute bottom-12 left-12">
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 bg-primary rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-primary/50 rounded-full animate-pulse-ring" />
                  </div>
                </div>
                <div className="absolute bottom-12 right-12">
                  <div className="relative w-4 h-4">
                    <div className="absolute inset-0 bg-primary rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-primary/50 rounded-full animate-pulse-ring" />
                  </div>
                </div>
                
                {/* Board outline for top-down camera */}
                <svg className="absolute inset-0 w-full h-full">
                  <rect
                    x="10%"
                    y="10%"
                    width="80%"
                    height="80%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-primary/50 animate-pulse"
                    rx="4"
                  />
                </svg>
              </>
            )}
          </div>
        )}

        {/* Control Overlay (visible on hover) */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="backdrop-blur-sm"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="secondary" size="sm" className="backdrop-blur-sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" className="backdrop-blur-sm">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Info Bar */}
      <div className="p-3 border-t bg-card/50 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${healthColors[health]}`}>
            {healthIcon[health]}
            <span className="ml-1.5 capitalize">{health}</span>
          </Badge>
          <span className="text-sm font-medium">{label}</span>
        </div>

        <div className="flex items-center gap-3">
          {fps && (
            <Badge variant="secondary" className="text-xs font-mono">
              {fps} FPS
            </Badge>
          )}
          {latency_ms && (
            <Badge variant="secondary" className="text-xs font-mono">
              {latency_ms}ms
            </Badge>
          )}
          {resolution && (
            <Badge variant="secondary" className="text-xs font-mono">
              {resolution.width}×{resolution.height}
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setShowOverlay(!showOverlay)}
          >
            {showOverlay ? <Eye className="h-3.5 w-3.5" /> : <Grid3x3 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function CameraWall() {
  const { cameraFeeds, updateCameraFeed } = useDashboardStore();

  // Initialize camera feeds with mock data
  useEffect(() => {
    Object.entries(mockCameraFeeds).forEach(([id, feed]) => {
      updateCameraFeed(id, feed);
    });

    // Simulate connection
    setTimeout(() => {
      Object.keys(mockCameraFeeds).forEach((id) => {
        updateCameraFeed(id, { health: "connected" });
      });
    }, 1500);
  }, [updateCameraFeed]);

  const cameraFeedArray = Object.values(cameraFeeds);

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-y-auto">
      {/* Title */}
      <div className="flex items-center gap-2">
        <Camera className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold text-lg">Camera Feeds</h2>
        <Badge variant="secondary" className="ml-auto">
          {cameraFeedArray.length} Cameras
        </Badge>
      </div>

      {/* Feeds */}
      <div className="flex flex-col gap-4">
        {cameraFeedArray.length === 0 ? (
          <>
            <Skeleton className="w-full aspect-video rounded-lg" />
            <Skeleton className="w-full aspect-video rounded-lg" />
          </>
        ) : (
          cameraFeedArray.map((feed) => (
            <CameraFeedDisplay
              key={feed.id}
              id={feed.id}
              label={feed.label}
              url={feed.url}
              health={feed.health}
              fps={feed.fps}
              latency_ms={feed.latency_ms}
              resolution={feed.resolution}
            />
          ))
        )}
      </div>
    </div>
  );
}
