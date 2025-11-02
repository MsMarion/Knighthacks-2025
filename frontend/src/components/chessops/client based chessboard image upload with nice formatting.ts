"use client";
import { useState, useEffect } from "react";
import { Eye, Target, Brain, RefreshCw } from "lucide-react";
import { PipelineEvent } from "@/components/chessops/Agents/types";
import { apiCurrentBoardSvg } from "@/lib/api";

function TimeDisplay({ timestamp }: { timestamp: number }) {
  const [timeString, setTimeString] = useState<string>("");
  
  useEffect(() => {
    setTimeString(new Date(timestamp).toLocaleTimeString());
  }, [timestamp]);
  
  return <span>{timeString}</span>;
}

export function ChessBoardVisualizer({ className }: { className?: string }) {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [boardSvg, setBoardSvg] = useState<string>("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchCurrentBoard = async () => {
    try {
      const svg = await apiCurrentBoardSvg();
      setBoardSvg(svg);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch current board:", error);
      setBoardSvg("");
    }
  };

  useEffect(() => {
    fetchCurrentBoard();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setEvents([]);

    const formData = new FormData(event.currentTarget);
    
    try {
      const response = await fetch('http://127.0.0.1:8100/predict-stream', {
        method: 'POST',
        body: formData,
      });

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            setIsLoading(false);
            fetchCurrentBoard(); // Refresh board after stream finishes
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || '';

          for (const message of messages) {
            if (message.startsWith('data: ')) {
              const data = message.substring(6);
              if (data === 'FINISHED') {
                setIsLoading(false);
                fetchCurrentBoard(); // Refresh board after stream finishes
                return;
              }

              const [type, ...contentParts] = data.split(':');
              const content = contentParts.join(':');

              if (type === 'text') {
                const event = { type: 'text' as const, content };
                setEvents(prev => [...prev, event]);
              } else if (type === 'image') {
                const [title, imageData] = content.split(':data:image/jpeg;base64,');
                const event = { type: 'image' as const, title, content: `data:image/jpeg;base64,${imageData}` };
                setEvents(prev => [...prev, event]);
              }
            }
          }
        }
      };

      processStream();

    } catch (error) {
      console.error('Error processing stream:', error);
      setIsLoading(false);
      setEvents([{ type: 'text', content: `Error: ${error instanceof Error ? error.message : String(error)}` }]);
    }
  };

  const lastTwoImages = events.filter(e => e.type === 'image').slice(-2);
  const fenOutput = events.filter(e => e.type === 'text' && e.content.startsWith('FEN:')).slice(-1)[0]?.content || 'No FEN available';
  const logEvents = events.filter(e => e.type === 'text');

  return (
    <div className={`rounded-2xl bg-zinc-950 shadow-soft ring-1 ring-white/10 p-6 ${className || ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Chess Detection Pipeline</h3>
        <form onSubmit={handleSubmit} className="flex items-center gap-4">
          <input type="file" name="image" required className="flex-grow" />
          <select name="a1_pos" defaultValue="BL" className="bg-zinc-800 p-2 rounded">
            <option value="BL">Bottom-Left</option>
            <option value="BR">Bottom-Right</option>
            <option value="TL">Top-Left</option>
            <option value="TR">Top-Right</option>
          </select>
          <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 p-2 rounded disabled:bg-gray-500">
            {isLoading ? 'Processing...' : 'Run Prediction'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Board */}
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="size-5 text-fuchsia-400" />
            <h4 className="text-lg font-semibold text-white">Current Board</h4>
            {lastUpdate && (
              <span className="text-xs text-zinc-400 ml-auto">
                Updated: <TimeDisplay timestamp={lastUpdate.getTime()} />
              </span>
            )}
            <button
              onClick={fetchCurrentBoard}
              disabled={isLoading}
              className="rounded-lg p-2 hover:bg-zinc-800 disabled:opacity-50"
              title="Refresh Board"
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="bg-zinc-950 rounded-lg p-4 flex items-center justify-center min-h-[256px] border border-zinc-600/30">
            {boardSvg ? (
              <div 
                className="w-full max-w-[300px]"
                dangerouslySetInnerHTML={{ __html: boardSvg }}
              />
            ) : (
              <div className="text-center text-zinc-500 py-16">
                <Eye className="size-12 mx-auto mb-3 text-zinc-600" />
                <div className="text-sm">No board state available</div>
              </div>
            )}
          </div>
        </div>

        {/* Debug Images */}
        {lastTwoImages.map((event, idx) => (
          <div key={idx} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="size-5 text-blue-400" />
              <h4 className="text-lg font-semibold text-white">{event.title || `Debug Step ${idx + 1}`}</h4>
            </div>
            <div className="relative">
              <img src={event.content} alt={event.title} className="w-full h-64 object-contain rounded-lg border border-zinc-600/30" />
              <div className="absolute top-2 right-2 bg-zinc-900/80 text-white text-xs px-2 py-1 rounded">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {/* Current Board (FEN) */}
        {/*
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Target className="size-5 text-green-400" />
            <h4 className="text-lg font-semibold text-white">Current Board (FEN)</h4>
          </div>
          <div className="relative">
            <div className="w-full h-64 bg-zinc-800/30 rounded-lg border border-zinc-600/30 flex items-center justify-center p-4">
              <p className="font-mono text-sm text-zinc-200 whitespace-pre-wrap">
                {fenOutput}
              </p>
            </div>
            <div className="absolute top-2 right-2 bg-zinc-900/80 text-white text-xs px-2 py-1 rounded">
              Live
            </div>
          </div>
        </div>
        */}
      </div>

      {/* Text Events Log */}
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50 mt-6">
        <h4 className="text-lg font-semibold text-white mb-4">Pipeline Log</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {logEvents.map((event, index) => (
            <p key={index} className="font-mono text-xs text-zinc-400 whitespace-pre-wrap">{event.content}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
