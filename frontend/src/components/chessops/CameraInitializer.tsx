"use client";
import { useEffect, useState } from "react";
import { Video, AlertCircle, CheckCircle } from "lucide-react";
import { cameraManager } from "@/lib/cameraManager";

export function CameraInitializer() {
  const [status, setStatus] = useState<"initializing" | "success" | "error">("initializing");
  const [message, setMessage] = useState("Initializing cameras...");
  const [deviceCount, setDeviceCount] = useState(0);

  useEffect(() => {
    const initialize = async () => {
      try {
        setStatus("initializing");
        setMessage("Requesting camera permissions...");
        
        await cameraManager.initialize();
        const devices = cameraManager.getDevices();
        setDeviceCount(devices.length);
        
        if (devices.length === 0) {
          setStatus("error");
          setMessage("No cameras detected. Please connect a camera and refresh the page.");
        } else {
          setStatus("success");
          setMessage(`Found ${devices.length} camera${devices.length > 1 ? 's' : ''} ready to use.`);
        }
      } catch (error) {
        console.error('Camera initialization failed:', error);
        setStatus("error");
        setMessage("Camera access denied. Please allow camera permissions and refresh the page.");
      }
    };

    initialize();
  }, []);

  if (status === "success") {
    return null; // Hide when successful
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
      <div className="rounded-2xl bg-zinc-950 p-6 shadow-2xl ring-1 ring-white/10 max-w-md">
        <div className="flex items-center gap-3 mb-4">
          {status === "error" ? (
            <AlertCircle className="size-6 text-red-400" />
          ) : (
            <Video className="size-6 text-fuchsia-400 animate-pulse" />
          )}
          <h3 className="text-lg font-semibold">Camera Setup</h3>
        </div>
        
        <p className="text-zinc-300 mb-4">{message}</p>
        
        {status === "error" && (
          <div className="space-y-3">
            <div className="text-sm text-zinc-400">
              <p>To fix this issue:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Make sure cameras are connected to your computer</li>
                <li>Allow camera permissions when prompted</li>
                <li>Check that no other applications are using the cameras</li>
                <li>Try refreshing the page</li>
              </ul>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-xl bg-fuchsia-500/20 px-4 py-2 text-sm hover:bg-fuchsia-500/25"
            >
              Refresh Page
            </button>
          </div>
        )}
        
        {status === "initializing" && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-fuchsia-400 border-t-transparent"></div>
            <span>Setting up cameras...</span>
          </div>
        )}
      </div>
    </div>
  );
}
