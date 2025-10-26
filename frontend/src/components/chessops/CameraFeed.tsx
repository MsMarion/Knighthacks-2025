"use client";
import { useEffect, useRef, useState } from "react";
import { Video, VideoOff, Settings } from "lucide-react";
import { cameraManager, type CameraDevice } from "@/lib/cameraManager";

type Props = {
  title: string;
  deviceId?: string;
  overlays?: React.ReactNode;
};

export function CameraFeed({ title, deviceId, overlays }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"connecting"|"connected"|"error">("connecting");
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(deviceId);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);

  // Initialize camera manager and get devices
  useEffect(() => {
    const initializeCameras = async () => {
      await cameraManager.initialize();
      setDevices(cameraManager.getDevices());
      
      // Auto-select first device if none selected
      if (!selectedDeviceId && cameraManager.getDevices().length > 0) {
        setSelectedDeviceId(cameraManager.getDevices()[0].deviceId);
      }
    };

    initializeCameras();

    // Subscribe to device changes
    const unsubscribe = cameraManager.subscribe(() => {
      setDevices(cameraManager.getDevices());
    });

    return () => {
      unsubscribe();
    };
  }, [selectedDeviceId]);

  // Start camera stream
  useEffect(() => {
    if (!selectedDeviceId) return;

    let timeoutId: NodeJS.Timeout;
    let video: HTMLVideoElement | null = null;
    let eventListeners: Array<{ element: HTMLVideoElement; event: string; handler: EventListener }> = [];

    const startStream = async () => {
      try {
        setStatus("connecting");
        console.log('Starting stream for device:', selectedDeviceId);
        
        const stream = await cameraManager.getStream(selectedDeviceId);
        console.log('Got stream:', stream);
        
        if (stream && videoRef.current) {
          video = videoRef.current;
          video.srcObject = stream;
          console.log('Set video srcObject');
          
          // Set up event listeners
          const handleLoadedMetadata = () => {
            console.log('Video metadata loaded');
            setStatus("connected");
          };
          
          const handleError = (e: Event) => {
            console.error('Video error:', e);
            setStatus("error");
          };
          
          const handleCanPlay = () => {
            console.log('Video can play');
            setStatus("connected");
          };
          
          const handlePlay = () => {
            console.log('Video playing');
            setStatus("connected");
          };
          
          // Add event listeners and track them for cleanup
          const events = [
            { event: 'loadedmetadata', handler: handleLoadedMetadata },
            { event: 'error', handler: handleError },
            { event: 'canplay', handler: handleCanPlay },
            { event: 'play', handler: handlePlay }
          ];
          
          events.forEach(({ event, handler }) => {
            video!.addEventListener(event, handler);
            eventListeners.push({ element: video!, event, handler });
          });
          
          // Try to play immediately
          try {
            await video.play();
            console.log('Video play started');
          } catch (playError) {
            console.log('Auto-play failed, waiting for user interaction:', playError);
          }
          
          // Timeout fallback
          timeoutId = setTimeout(() => {
            if (status === "connecting") {
              console.log('Video load timeout, trying to play');
              video?.play().catch(console.error);
            }
          }, 5000);
        } else {
          console.error('No stream or video element');
          setStatus("error");
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setStatus("error");
      }
    };

    startStream();

    // Cleanup on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      // Remove all event listeners
      eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      
      if (selectedDeviceId) {
        cameraManager.stopStream(selectedDeviceId);
      }
    };
  }, [selectedDeviceId]);

  const handleDeviceChange = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId);
    setShowDeviceSelector(false);
  };

  return (
    <div className="relative rounded-2xl bg-zinc-950 shadow-soft ring-1 ring-white/10 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-sm flex-shrink-0">
        <span className="font-medium">{title}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${status==="connected"?"text-emerald-400":"text-amber-400"}`}>
            {status}
          </span>
          <button
            onClick={() => setShowDeviceSelector(!showDeviceSelector)}
            className="rounded-lg p-1 hover:bg-white/10"
            title="Select Camera"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <video 
          ref={videoRef} 
          className="w-full h-full rounded-b-2xl bg-black object-cover" 
          autoPlay 
          muted 
          playsInline 
          style={{ display: status === "connected" ? "block" : "none" }}
          onClick={() => {
            if (videoRef.current) {
              console.log('Manual play attempt');
              videoRef.current.play().catch(console.error);
            }
          }}
        />
        {status !== "connected" && (
          <div className="flex w-full h-full items-center justify-center rounded-b-2xl bg-black">
            {status === "error" ? (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <VideoOff className="size-8" />
                <span className="text-sm">Camera Error</span>
                <button
                  onClick={async () => {
                    console.log('Manual retry');
                    if (selectedDeviceId) {
                      const stream = await cameraManager.getStream(selectedDeviceId);
                      if (stream && videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().catch(console.error);
                      }
                    }
                  }}
                  className="mt-2 rounded bg-fuchsia-500/20 px-3 py-1 text-xs hover:bg-fuchsia-500/30"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-zinc-400">
                <Video className="size-8 animate-pulse" />
                <span className="text-sm">Connecting...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Device Selector Dropdown */}
        {showDeviceSelector && (
          <div className="absolute top-2 right-2 z-10 rounded-lg bg-zinc-900 p-2 shadow-lg ring-1 ring-white/10">
            <div className="text-xs font-medium text-zinc-300 mb-2">Select Camera:</div>
            {devices.length === 0 ? (
              <div className="text-xs text-zinc-400">No cameras found</div>
            ) : (
              <div className="space-y-1">
                {devices.map((device) => (
                  <button
                    key={device.deviceId}
                    onClick={() => handleDeviceChange(device.deviceId)}
                    className={`block w-full rounded px-2 py-1 text-left text-xs hover:bg-white/10 ${
                      selectedDeviceId === device.deviceId ? 'bg-fuchsia-500/20 text-fuchsia-300' : 'text-zinc-300'
                    }`}
                  >
                    {device.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="pointer-events-none absolute inset-0">{overlays}</div>
      </div>
    </div>
  );
}
