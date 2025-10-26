/**
 * Pipeline Event Types
 * 
 * Defines the shape of real-time chess detection pipeline events.
 * Fields marked REPO-UNKNOWN are not yet exposed by backend.
 */

export interface PipelineFrameEvent {
  frame_id: string;
  timestamp: number;
  
  // Stage timing breakdown (REPO-UNKNOWN: backend doesn't expose this yet)
  stage_timings?: {
    preprocess_ms: number;
    board_detect_ms: number;
    grid_fit_ms: number;
    crop_ms: number;
    classify_ms: number;
    postprocess_ms: number;
  };
  
  // Board geometry from corner detection (REPO-UNKNOWN)
  board_geometry?: {
    corners: [number, number][]; // 4 corners [x,y]
    cell_centers?: [number, number][]; // 64 centers
    reprojection_error?: number;
    skew?: number;
  };
  
  // Per-cell classification scores
  cell_scores?: Array<{
    cell: string; // "a1", "b2", ..., "h8"
    top1_class: string; // "R", "n", "0" (empty), etc.
    top1_confidence: number; // 0-1
    top_k?: Array<{ class: string; confidence: number }>;
    entropy?: number; // Classification uncertainty
    delta_vs_previous?: number; // Change from last frame
  }>;
  
  // Accepted board state after validation
  accepted_board_state?: {
    fen: string;
    last_move?: string; // e.g., "e2e4"
    pgn?: string;
    diff?: {
      added: string[]; // cells where pieces appeared
      removed: string[]; // cells where pieces disappeared
      moved: Array<{ from: string; to: string }>;
    };
  };
  
  // Anomalies and warnings
  anomalies?: Array<{
    type: "low_confidence" | "illegal_move" | "corner_drift" | "exposure_change";
    severity: "warning" | "error";
    message: string;
    affected_cells?: string[];
  }>;
  
  // Debug artifacts (REPO-UNKNOWN: URLs to intermediate images)
  debug_artifacts?: {
    raw_frame_url?: string;
    warped_board_url?: string;
    crops?: Record<string, string>; // cell -> crop image URL
  };
}

/**
 * Aggregated metrics for timeline visualization
 */
export interface PipelineMetrics {
  timestamp: number;
  total_latency_ms: number;
  num_detections: number;
  avg_confidence: number;
  has_anomalies: boolean;
}

/**
 * Pipeline stage for stepper visualization
 */
export type PipelineStage = 
  | "raw"
  | "board_detect"
  | "grid_fit"
  | "crop"
  | "classify"
  | "validate"
  | "complete";

export interface PipelineStageInfo {
  stage: PipelineStage;
  label: string;
  description: string;
  timing_ms?: number;
  status?: "idle" | "processing" | "complete" | "error";
}

