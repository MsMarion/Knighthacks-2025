/**
 * Camera Feed Types
 * 
 * REPO-UNKNOWN: Backend doesn't expose camera streams yet.
 * This defines the expected interface.
 */

export type CameraProtocol = "mjpeg" | "webrtc" | "hls" | "ws" | "static";

export type CameraHealth = "connecting" | "connected" | "buffering" | "error" | "disconnected";

export interface CameraFeed {
  id: string; // "robot-arm" | "top-down"
  label: string; // Human-readable name
  url?: string; // Stream URL (if available)
  protocol: CameraProtocol;
  resolution?: { width: number; height: number };
  fps?: number;
  health: CameraHealth;
  latency_ms?: number;
  error_message?: string;
}

/**
 * Camera overlay configuration
 */
export interface CameraOverlay {
  grid?: {
    enabled: boolean;
    corners?: [number, number][]; // 4 corners for perspective
    cells?: boolean; // Show 8x8 grid
    indices?: boolean; // Show a1-h8 labels
  };
  keypoints?: {
    enabled: boolean;
    points?: Array<{ x: number; y: number; label?: string }>;
  };
  boxes?: {
    enabled: boolean;
    rectangles?: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      label?: string;
      confidence?: number;
      color?: string;
    }>;
  };
  pose?: {
    enabled: boolean;
    joints?: Array<{
      name: string;
      angle: number;
      position?: [number, number];
    }>;
    gripper_state?: "open" | "closed" | "moving";
  };
  safety?: {
    enabled: boolean;
    zones?: Array<{
      polygon: [number, number][];
      type: "safe" | "caution" | "danger";
    }>;
  };
}

/**
 * Camera control state
 */
export interface CameraControls {
  play_pause: boolean; // true = playing
  snapshot_enabled: boolean;
  record_enabled: boolean;
  pip_enabled: boolean;
  fullscreen_enabled: boolean;
}

