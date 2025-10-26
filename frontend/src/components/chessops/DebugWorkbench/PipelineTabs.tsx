"use client";
import { useState, useEffect } from "react";
import { apiCurrentBoardSvg } from "@/lib/api";
import { Eye, RefreshCw } from "lucide-react";

export function DebugWorkbench() {
  const [debugImages, setDebugImages] = useState<string[]>([]);
  const [currentBoard, setCurrentBoard] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch debug images and current board
  const fetchPipelineData = async () => {
    setIsLoading(true);
    try {
      // Fetch debug images
      const response = await fetch('/api/debug-images');
      if (response.ok) {
        const data = await response.json();
        const sortedImages = data.images || [];
        // Get last 2 images
        const lastTwo = sortedImages.slice(-2);
        setDebugImages(lastTwo);
      }

      // Fetch current board - handle gracefully if backend is not available
      try {
        const boardSvg = await apiCurrentBoardSvg();
        setCurrentBoard(boardSvg);
      } catch (boardError) {
        // Backend not available, set empty board
        console.log('Backend API not available');
        setCurrentBoard("");
      }
    } catch (error) {
      console.error('Failed to fetch pipeline data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineData();
    // Poll for updates every 2 seconds
    const interval = setInterval(fetchPipelineData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl bg-zinc-950 shadow-soft ring-1 ring-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Pipeline Timeline</h3>
        <button
          onClick={fetchPipelineData}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Last 2 Debug Images */}
        {debugImages.length > 0 ? (
          debugImages.map((imgPath, idx) => {
            const imageUrl = `/api/debug-image?path=${encodeURIComponent(imgPath)}`;
            return (
              <div key={idx} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="size-5 text-blue-400" />
                  <h4 className="text-lg font-semibold text-white">
                    Debug Step {debugImages.length - idx}
                  </h4>
                </div>
                <div className="relative bg-zinc-950 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Debug step ${debugImages.length - idx}`}
                    className="w-full h-64 object-contain rounded-lg border border-zinc-600/30"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-zinc-900/80 text-white text-xs px-2 py-1 rounded">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 flex items-center justify-center py-16 text-zinc-500">
            <div className="text-center">
              <Eye className="size-12 mx-auto mb-3 text-zinc-600" />
              <div className="text-sm">No debug images available</div>
            </div>
          </div>
        )}

        {/* Current Board */}
        <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="size-5 text-green-400" />
            <h4 className="text-lg font-semibold text-white">Current Board</h4>
          </div>
          <div className="bg-zinc-950 rounded-lg p-4 flex items-center justify-center min-h-[256px] border border-zinc-600/30">
            {currentBoard ? (
              <div 
                className="w-full max-w-[300px]"
                dangerouslySetInnerHTML={{ __html: currentBoard }}
              />
            ) : (
              <div className="text-center text-zinc-500 py-16">
                <Eye className="size-12 mx-auto mb-3 text-zinc-600" />
                <div className="text-sm">No board state available</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
