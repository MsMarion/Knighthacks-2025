"use client";
import { useState, useEffect } from "react";
import { RefreshCw, Eye, EyeOff, ArrowRight, Brain } from "lucide-react";
import { apiCurrentBoardSvg, apiVisualizeNextMove, apiNextMove } from "@/lib/api";

function TimeDisplay({ timestamp }: { timestamp: number }) {
  const [timeString, setTimeString] = useState<string>("");
  
  useEffect(() => {
    setTimeString(new Date(timestamp).toLocaleTimeString());
  }, [timestamp]);
  
  return <span>{timeString}</span>;
}

interface ChessBoardVisualizerProps {
  className?: string;
}

export function ChessBoardVisualizer({ className }: ChessBoardVisualizerProps) {
  const [boardSvg, setBoardSvg] = useState<string>("");
  const [nextMoveSvg, setNextMoveSvg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNextMove, setShowNextMove] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadCurrentBoard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const svg = await apiCurrentBoardSvg();
      setBoardSvg(svg);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load board");
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextMoveVisualization = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const svg = await apiVisualizeNextMove();
      setNextMoveSvg(svg);
      setShowNextMove(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load next move");
    } finally {
      setIsLoading(false);
    }
  };

  const executeNextMove = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiNextMove();
      setBoardSvg(result.board_svg_with_move);
      setLastUpdate(new Date());
      setShowNextMove(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute move");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentBoard();
  }, []);

  return (
    <div className={`rounded-2xl bg-zinc-950 shadow-soft ring-1 ring-white/10 p-6 ${className || ""}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Brain className="size-6 text-fuchsia-400" />
          <h3 className="text-lg font-semibold">Chess Board</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-zinc-400">
              Updated: <TimeDisplay timestamp={lastUpdate.getTime()} />
            </span>
          )}
          <button
            onClick={loadCurrentBoard}
            disabled={isLoading}
            className="rounded-lg p-2 hover:bg-zinc-800 disabled:opacity-50"
            title="Refresh Board"
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="text-sm text-red-300">{error}</div>
        </div>
      )}

      <div className="space-y-4">
        {/* Current Board */}
        <div className="bg-white rounded-lg p-4 min-h-[300px] flex items-center justify-center">
          {boardSvg ? (
            <div 
              className="w-full h-full flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: boardSvg }}
            />
          ) : (
            <div className="text-zinc-400 text-center">
              {isLoading ? "Loading board..." : "No board data available"}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={loadNextMoveVisualization}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-fuchsia-500/20 px-4 py-2 text-sm font-medium hover:bg-fuchsia-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Show Next Move
              </>
            )}
          </button>
          
          <button
            onClick={executeNextMove}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-medium hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ArrowRight className="size-4" />
            Execute Move
          </button>
        </div>

        {/* Next Move Visualization */}
        {showNextMove && nextMoveSvg && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-fuchsia-400" />
              <span className="text-sm font-medium text-zinc-300">Next Move Preview</span>
              <button
                onClick={() => setShowNextMove(false)}
                className="ml-auto rounded-lg p-1 hover:bg-zinc-800"
                title="Hide preview"
              >
                <EyeOff className="size-4" />
              </button>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              <div 
                className="w-full h-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: nextMoveSvg }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
