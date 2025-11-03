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
  const [logEvents, setLogEvents] = useState<PipelineEvent[]>([]);
  const [imageEvents, setImageEvents] = useState<PipelineEvent[]>(Array(3).fill({ type: 'image', title: 'Waiting for image...', content: '' }));
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

    const ws = new WebSocket('ws://localhost:3001');
    let buffer = '';

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const messageData = event.data;
      try {
        const parsedMessage = JSON.parse(messageData);
        if (parsedMessage.type === 'clear') {
          setLogEvents([]);
          setImageEvents(Array(3).fill({ type: 'image', title: 'Loading...', content: '' }));
          return;
        }
      } catch (e) {
        // Not a JSON message, proceed with stream processing
      }

      buffer += messageData;
      let messages = buffer.split('\n\n');
      buffer = messages.pop() || ''; // Keep the last (potentially incomplete) message in the buffer

      for (const msg of messages) {
        if (msg.startsWith('data: ')) {
          const data = msg.substring(6);
          if (data === 'FINISHED') {
            fetchCurrentBoard(); // Refresh board after stream finishes
            continue; // Continue processing other messages in the buffer
          }

          const [type, ...contentParts] = data.split(':');
          const content = contentParts.join(':');

          if (type === 'text') {
            const event = { type: 'text' as const, content };
            setLogEvents(prev => [...prev, event]);
          } else if (type === 'image') {
            const [title, imageData] = content.split(':data:image/jpeg;base64,');
            const event = { type: 'image' as const, title, content: `data:image/jpeg;base64,${imageData}` };
            setImageEvents(prev => [...prev.slice(-2), event]);
          }
        }
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className={`rounded-2xl bg-zinc-950 shadow-soft ring-1 ring-white/10 p-6 ${className || ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Chess Detection Pipeline</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Debug Images */}
        <div className="col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          {imageEvents.map((event, idx) => (
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
        </div>


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
              className="rounded-lg p-2 hover:bg-zinc-800 disabled:opacity-50"
              title="Refresh Board"
            >
              <RefreshCw className={`size-4`} />
            </button>
          </div>
          <div className="bg-zinc-950 rounded-lg p-4 flex items-center justify-center min-h-[256px] border border-zinc-600/30">
            {boardSvg ? (
              <div 
                className="w-full"
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

        {/* Text Events Log */}
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
          <h4 className="text-lg font-semibold text-white mb-4">Pipeline Log</h4>
          <div className="space-y-2 overflow-y-auto">
            {logEvents.map((event, index) => (
              <p key={index} className="font-mono text-xs text-zinc-400 whitespace-pre-wrap">{event.content}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
