/**
 * TopBar Component
 * 
 * Status indicators, session controls, and quick actions for the dashboard
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  Camera, 
  Wifi, 
  WifiOff, 
  AlertCircle,
  Settings,
  Moon,
  Sun,
  Command
} from "lucide-react";
import { useDashboardStore } from "../store/dashboardStore";
import { useState, useEffect } from "react";

export function TopBar({ onOpenCommand }: { onOpenCommand?: () => void }) {
  const { 
    pipelineConnected, 
    agentConnected,
    cameraFeeds,
  } = useDashboardStore();

  const [isDark, setIsDark] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const cameraFeedArray = Object.values(cameraFeeds);
  const allCamerasHealthy = cameraFeedArray.every(feed => feed.health === "connected");
  const anyCameraError = cameraFeedArray.some(feed => feed.health === "error");

  return (
    <div className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center px-6 gap-4">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary animate-pulse" />
        <h1 className="font-semibold text-lg">ChessOps Dashboard</h1>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Status Indicators */}
      <div className="flex items-center gap-3">
        {/* Pipeline Status */}
        <div className="flex items-center gap-2">
          {pipelineConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="text-xs border-green-500/50 bg-green-500/10">
                Pipeline Online
              </Badge>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <Badge variant="outline" className="text-xs border-red-500/50 bg-red-500/10">
                Pipeline Offline
              </Badge>
            </>
          )}
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Agent Status */}
        <div className="flex items-center gap-2">
          {agentConnected ? (
            <>
              <Activity className="h-4 w-4 text-blue-500" />
              <Badge variant="outline" className="text-xs border-blue-500/50 bg-blue-500/10">
                Agents Active
              </Badge>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <Badge variant="outline" className="text-xs border-yellow-500/50 bg-yellow-500/10">
                Agents Idle
              </Badge>
            </>
          )}
        </div>

        <Separator orientation="vertical" className="h-4" />

        {/* Camera Status */}
        <div className="flex items-center gap-2">
          {anyCameraError ? (
            <>
              <Camera className="h-4 w-4 text-red-500" />
              <Badge variant="outline" className="text-xs border-red-500/50 bg-red-500/10">
                Camera Error
              </Badge>
            </>
          ) : allCamerasHealthy ? (
            <>
              <Camera className="h-4 w-4 text-green-500" />
              <Badge variant="outline" className="text-xs border-green-500/50 bg-green-500/10">
                Cameras ({cameraFeedArray.length})
              </Badge>
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 text-yellow-500" />
              <Badge variant="outline" className="text-xs border-yellow-500/50 bg-yellow-500/10">
                Cameras Connecting...
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Current Time */}
        <div className="text-sm text-muted-foreground font-mono">
          {currentTime.toLocaleTimeString()}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Command Palette */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenCommand}
          className="h-8 gap-2 text-xs"
        >
          <Command className="h-4 w-4" />
          <span className="hidden sm:inline">Command</span>
          <kbd className="hidden sm:inline pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-8 w-8 p-0"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
