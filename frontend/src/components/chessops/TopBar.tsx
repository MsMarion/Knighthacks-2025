"use client";
import { useState, useEffect } from "react";
import { apiSetElo, apiNextMove } from "@/lib/api";
import { Rocket, Signal, Sun, Triangle, Moon, Play, Pause } from "lucide-react";

export function TopBar() {
  const [elo, setElo] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLive, setIsLive] = useState(true);

  // Handle Elo changes
  const handleEloChange = async (newElo: number) => {
    setElo(newElo);
    try {
      await apiSetElo(newElo);
      console.log(`Elo set to ${newElo}`);
    } catch (error) {
      console.error('Failed to set Elo:', error);
    }
  };

  // Handle Run button
  const handleRun = async () => {
    if (isRunning) {
      setIsRunning(false);
      console.log('Stopping ChessOps...');
    } else {
      setIsRunning(true);
      console.log('Starting ChessOps...');
      
      try {
        // Simulate running the chess system
        const result = await apiNextMove();
        console.log('Next move calculated:', result);
      } catch (error) {
        console.error('Failed to calculate next move:', error);
        setIsRunning(false);
      }
    }
  };

  // Handle Theme toggle
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // Apply theme to document
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  // Simulate live status
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1920px] items-center gap-3 px-4 py-2">
        <Triangle className="size-5 text-fuchsia-400" />
        <div className="font-semibold">ChessOps Dashboard</div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Signal className={`size-4 ${isLive ? 'text-emerald-400' : 'text-zinc-500'}`} /> 
            {isLive ? 'live' : 'offline'}
          </div>
          <input
            className="w-24 rounded-xl bg-zinc-900 px-3 py-1 text-sm focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none"
            type="number"
            value={elo}
            min={1320}
            max={3190}
            onChange={(e) => {
              const value = parseInt(e.target.value || "1500", 10);
              if (value >= 1320 && value <= 3190) {
                handleEloChange(value);
              }
            }}
            title="Stockfish Elo Rating"
          />
          <button 
            onClick={handleRun}
            className={`rounded-xl px-3 py-1 text-sm transition-colors ${
              isRunning 
                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/25' 
                : 'bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/25'
            }`}
            title={isRunning ? 'Stop ChessOps' : 'Start ChessOps'}
          >
            {isRunning ? (
              <>
                <Pause className="mr-1 inline size-4" /> Stop
              </>
            ) : (
              <>
                <Rocket className="mr-1 inline size-4" /> Run
              </>
            )}
          </button>
          <button 
            onClick={handleThemeToggle}
            className="rounded-xl bg-zinc-900 px-3 py-1 text-sm hover:bg-zinc-800 transition-colors"
            title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? (
              <>
                <Sun className="mr-1 inline size-4" /> Light
              </>
            ) : (
              <>
                <Moon className="mr-1 inline size-4" /> Dark
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
