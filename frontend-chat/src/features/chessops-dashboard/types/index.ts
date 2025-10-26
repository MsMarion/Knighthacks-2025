/**
 * Unified type exports for ChessOps Dashboard
 */

export * from "./pipeline";
export * from "./camera";
export * from "./agent";
export * from "./chat";

/**
 * Global selection context
 * 
 * Shared state for cross-component linking:
 * - Timeline brush → filters table & tabs
 * - Table row selection → highlights overlays
 * - Heatmap hover → previews crops
 */
export interface SelectionContext {
  // Time window from timeline brush
  time_window?: {
    start_timestamp: number;
    end_timestamp: number;
  };
  
  // Selected frame for detail views
  selected_frame_id?: string;
  
  // Selected cells for highlighting
  selected_cells?: string[];
  
  // Selected agent thread
  selected_thread_id?: string;
  
  // Hovered cell (for preview popovers)
  hovered_cell?: string;
}

/**
 * Feature flag for dashboard toggle
 */
export const FEATURE_FLAG_DASHBOARD = import.meta.env.VITE_FEATURE_CHESSOPS_DASHBOARD === "true";

