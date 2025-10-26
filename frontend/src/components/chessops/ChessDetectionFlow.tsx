"use client";
import { useState, useRef, useEffect } from "react";
import { Upload, Camera, Brain, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiPredict, apiCurrentBoardSvg, apiVisualizeNextMove, checkServerStatus } from "@/lib/api";

type DetectionStep = "upload" | "processing" | "result" | "error";
type A1Position = "BL" | "BR" | "TL" | "TR";

interface DetectionResult {
  fen: string;
  board_ascii: string;
  board_svg: string;
}

export function ChessDetectionFlow() {
  const [currentStep, setCurrentStep] = useState<DetectionStep>("upload");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [a1Position, setA1Position] = useState<A1Position>("BL");
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isServerOnline, setIsServerOnline] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check server status on mount
  useEffect(() => {
    checkServerStatus().then(setIsServerOnline);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setCurrentStep("processing");
      setError(null);
    }
  };

  const handleDetectBoard = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setCurrentStep("processing");
    setError(null);

    try {
      const result = await apiPredict(selectedImage, a1Position);
      setResult(result);
      setCurrentStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Detection failed");
      setCurrentStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep("upload");
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCaptureFromCamera = () => {
    // This would integrate with camera feeds
    console.log("Capture from camera not implemented yet");
  };

  if (isServerOnline === false) {
    return (
      <div className="rounded-2xl bg-zinc-950 shadow-soft ring-1 ring-white/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="size-6 text-red-400" />
          <h3 className="text-lg font-semibold">Server Offline</h3>
        </div>
        <p className="text-zinc-300 mb-4">
          The Chess2FEN server is not running. Please start the server at <code className="bg-zinc-800 px-2 py-1 rounded">http://127.0.0.1:8000</code>
        </p>
        <button
          onClick={() => checkServerStatus().then(setIsServerOnline)}
          className="rounded-xl bg-fuchsia-500/20 px-4 py-2 text-sm hover:bg-fuchsia-500/25"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-zinc-950 shadow-soft ring-1 ring-white/10 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="size-6 text-fuchsia-400" />
        <h3 className="text-lg font-semibold">Chess Board Detection</h3>
        {isServerOnline && (
          <div className="ml-auto flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle className="size-4" />
            Server Online
          </div>
        )}
      </div>

      {/* Step 1: Upload */}
      {currentStep === "upload" && (
        <div className="space-y-4">
          <div className="text-sm text-zinc-300 mb-4">
            Upload a chess board image or capture from camera
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-zinc-700 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-colors"
            >
              <Upload className="size-8 text-zinc-400" />
              <span className="text-sm font-medium">Upload Image</span>
            </button>
            
            <button
              onClick={handleCaptureFromCamera}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-zinc-700 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5 transition-colors"
            >
              <Camera className="size-8 text-zinc-400" />
              <span className="text-sm font-medium">Capture from Camera</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Step 2: Processing */}
      {currentStep === "processing" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="size-6 text-fuchsia-400 animate-spin" />
            <span className="text-lg font-medium">Processing Image</span>
          </div>

          {selectedImage && (
            <div className="space-y-4">
              <div className="text-sm text-zinc-300">Selected Image:</div>
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Selected chess board"
                className="w-full max-w-md mx-auto rounded-lg"
              />
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-300">
                  A1 Position (corner where A1 square is located):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["BL", "BR", "TL", "TR"] as A1Position[]).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setA1Position(pos)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        a1Position === pos
                          ? "bg-fuchsia-500/20 text-fuchsia-300"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {pos === "BL" && "Bottom Left"}
                      {pos === "BR" && "Bottom Right"}
                      {pos === "TL" && "Top Left"}
                      {pos === "TR" && "Top Right"}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleDetectBoard}
                disabled={isProcessing}
                className="w-full rounded-xl bg-fuchsia-500/20 px-4 py-3 text-sm font-medium hover:bg-fuchsia-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Detecting Board...
                  </>
                ) : (
                  <>
                    <Brain className="size-4" />
                    Detect Chess Board
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Result */}
      {currentStep === "result" && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="size-6 text-emerald-400" />
            <span className="text-lg font-medium">Detection Complete</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-zinc-300">Detected Board</h4>
              <div 
                className="bg-white rounded-lg p-4"
                dangerouslySetInnerHTML={{ __html: result.board_svg }}
              />
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-zinc-300">Board Information</h4>
              <div className="space-y-2">
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-400 mb-1">FEN String</div>
                  <div className="text-sm font-mono text-zinc-200 break-all">{result.fen}</div>
                </div>
                
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-xs text-zinc-400 mb-1">ASCII Board</div>
                  <pre className="text-xs font-mono text-zinc-200 whitespace-pre-wrap">{result.board_ascii}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              Detect Another Board
            </button>
            <button
              onClick={() => {
                // This would show the next move visualization
                console.log("Show next move visualization");
              }}
              className="flex-1 rounded-xl bg-fuchsia-500/20 px-4 py-2 text-sm hover:bg-fuchsia-500/25"
            >
              Show Next Move
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Error */}
      {currentStep === "error" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="size-6 text-red-400" />
            <span className="text-lg font-medium">Detection Failed</span>
          </div>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="text-sm text-red-300">{error}</div>
          </div>

          <button
            onClick={handleReset}
            className="w-full rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
