"""
Live chess piece detector for real-time detection.

Implements real-time chess piece detection from webcam feed
with frame stabilization and board mapping.
"""

import cv2
import numpy as np
import time
from typing import Dict, List, Optional, Tuple, Union
from pathlib import Path

from ..models.detector_yolo import YOLOChessDetector
from ..models.detector_inception import InceptionChessDetector
from ..utils.video_utils import VideoCapture
from ..utils.logger import get_global_logger


class LiveChessDetector:
    """
    Live chess piece detector for real-time detection.
    
    Provides real-time chess piece detection from webcam feed
    with frame stabilization and board mapping capabilities.
    """
    
    def __init__(
        self,
        detector_model: Union[str, Path, YOLOChessDetector, InceptionChessDetector],
        camera_index: int = 0,
        frame_stabilization: bool = True,
        stabilization_threshold: float = 0.02,
        min_detections: int = 3,
        board_mapping: Optional[Dict] = None
    ):
        """
        Initialize live chess detector.
        
        Args:
            detector_model: Detector model or path to model
            camera_index: Camera index for webcam
            frame_stabilization: Whether to use frame stabilization
            stabilization_threshold: Threshold for frame stability
            min_detections: Minimum detections for stable state
            board_mapping: Board position mapping
        """
        self.camera_index = camera_index
        self.frame_stabilization = frame_stabilization
        self.stabilization_threshold = stabilization_threshold
        self.min_detections = min_detections
        self.board_mapping = board_mapping or self._get_default_board_mapping()
        
        # Initialize detector
        if isinstance(detector_model, (YOLOChessDetector, InceptionChessDetector)):
            self.detector = detector_model
        else:
            # Try to load as YOLO first, then Inception
            try:
                self.detector = YOLOChessDetector(str(detector_model))
            except Exception:
                try:
                    self.detector = InceptionChessDetector(str(detector_model))
                except Exception as e:
                    raise RuntimeError(f"Failed to load detector model: {e}")
        
        # Initialize video capture
        self.video_capture = None
        self.previous_frame = None
        self.detection_history = []
        self.stable_detections = []
        
        # Initialize logger
        self.logger = get_global_logger()
    
    def _get_default_board_mapping(self) -> Dict:
        """Get default board position mapping."""
        # This is a placeholder - in practice, you would calibrate this
        # based on the actual board position in the camera view
        return {
            'a8': (100, 100), 'b8': (200, 100), 'c8': (300, 100), 'd8': (400, 100),
            'e8': (500, 100), 'f8': (600, 100), 'g8': (700, 100), 'h8': (800, 100),
            'a7': (100, 200), 'b7': (200, 200), 'c7': (300, 200), 'd7': (400, 200),
            'e7': (500, 200), 'f7': (600, 200), 'g7': (700, 200), 'h7': (800, 200),
            'a6': (100, 300), 'b6': (200, 300), 'c6': (300, 300), 'd6': (400, 300),
            'e6': (500, 300), 'f6': (600, 300), 'g6': (700, 300), 'h6': (800, 300),
            'a5': (100, 400), 'b5': (200, 400), 'c5': (300, 400), 'd5': (400, 400),
            'e5': (500, 400), 'f5': (600, 400), 'g5': (700, 400), 'h5': (800, 400),
            'a4': (100, 500), 'b4': (200, 500), 'c4': (300, 500), 'd4': (400, 500),
            'e4': (500, 500), 'f4': (600, 500), 'g4': (700, 500), 'h4': (800, 500),
            'a3': (100, 600), 'b3': (200, 600), 'c3': (300, 600), 'd3': (400, 600),
            'e3': (500, 600), 'f3': (600, 600), 'g3': (700, 600), 'h3': (800, 600),
            'a2': (100, 700), 'b2': (200, 700), 'c2': (300, 700), 'd2': (400, 700),
            'e2': (500, 700), 'f2': (600, 700), 'g2': (700, 700), 'h2': (800, 700),
            'a1': (100, 800), 'b1': (200, 800), 'c1': (300, 800), 'd1': (400, 800),
            'e1': (500, 800), 'f1': (600, 800), 'g1': (700, 800), 'h1': (800, 800)
        }
    
    def start_camera(self) -> bool:
        """
        Start camera capture.
        
        Returns:
            True if camera started successfully
        """
        try:
            self.video_capture = VideoCapture(self.camera_index)
            if not self.video_capture.is_opened():
                self.logger.log_error(Exception("Could not open camera"), "start_camera")
                return False
            
            self.logger.log_info(f"Camera started: {self.camera_index}", "start_camera")
            return True
            
        except Exception as e:
            self.logger.log_error(e, "start_camera")
            return False
    
    def stop_camera(self):
        """Stop camera capture."""
        if self.video_capture:
            self.video_capture.release()
            self.video_capture = None
            self.logger.log_info("Camera stopped", "stop_camera")
    
    def capture_frame(self) -> Optional[np.ndarray]:
        """
        Capture frame from camera.
        
        Returns:
            Captured frame or None if failed
        """
        if not self.video_capture or not self.video_capture.is_opened():
            return None
        
        ret, frame = self.video_capture.read()
        if not ret:
            return None
        
        return frame
    
    def is_frame_stable(self, current_frame: np.ndarray) -> bool:
        """
        Check if frame is stable.
        
        Args:
            current_frame: Current frame
            
        Returns:
            True if frame is stable
        """
        if not self.frame_stabilization or self.previous_frame is None:
            return True
        
        # Calculate frame difference
        diff = cv2.absdiff(current_frame, self.previous_frame)
        mean_diff = np.mean(diff) / 255.0
        
        return mean_diff < self.stabilization_threshold
    
    def detect_pieces(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect chess pieces in frame.
        
        Args:
            frame: Input frame
            
        Returns:
            List of piece detections
        """
        try:
            results = self.detector.detect(frame)
            detections = results['detections']
            
            # Add timestamp to detections
            timestamp = time.time()
            for detection in detections:
                detection['timestamp'] = timestamp
            
            return detections
            
        except Exception as e:
            self.logger.log_error(e, "detect_pieces")
            return []
    
    def update_detection_history(self, detections: List[Dict]):
        """
        Update detection history for stabilization.
        
        Args:
            detections: Current detections
        """
        self.detection_history.append(detections)
        
        # Keep only recent history
        max_history = 10
        if len(self.detection_history) > max_history:
            self.detection_history.pop(0)
    
    def get_stable_detections(self) -> List[Dict]:
        """
        Get stable detections from history.
        
        Returns:
            List of stable detections
        """
        if len(self.detection_history) < self.min_detections:
            return []
        
        # Find detections that appear consistently
        stable_detections = []
        
        # Group detections by position
        position_groups = {}
        for detections in self.detection_history:
            for detection in detections:
                center = detection['center']
                # Find nearby detections
                found_group = False
                for pos, group in position_groups.items():
                    if abs(center[0] - pos[0]) < 50 and abs(center[1] - pos[1]) < 50:
                        group.append(detection)
                        found_group = True
                        break
                
                if not found_group:
                    position_groups[center] = [detection]
        
        # Keep only groups with enough detections
        for pos, group in position_groups.items():
            if len(group) >= self.min_detections:
                # Get the most recent detection from this group
                latest_detection = max(group, key=lambda x: x['timestamp'])
                stable_detections.append(latest_detection)
        
        return stable_detections
    
    def map_to_board_positions(self, detections: List[Dict]) -> Dict[str, Dict]:
        """
        Map detections to board positions.
        
        Args:
            detections: List of detections
            
        Returns:
            Dictionary mapping board positions to pieces
        """
        board_state = {}
        
        for detection in detections:
            center = detection['center']
            class_name = detection['class_name']
            
            # Find closest board position
            min_distance = float('inf')
            closest_position = None
            
            for position, coords in self.board_mapping.items():
                distance = np.sqrt((center[0] - coords[0])**2 + (center[1] - coords[1])**2)
                if distance < min_distance:
                    min_distance = distance
                    closest_position = position
            
            if closest_position and min_distance < 100:  # Within reasonable distance
                board_state[closest_position] = {
                    'piece': class_name,
                    'confidence': detection['confidence'],
                    'center': center
                }
        
        return board_state
    
    def process_frame(self) -> Dict:
        """
        Process single frame for detection.
        
        Returns:
            Dictionary containing detection results
        """
        frame = self.capture_frame()
        if frame is None:
            return {'success': False, 'error': 'Failed to capture frame'}
        
        # Check frame stability
        is_stable = self.is_frame_stable(frame)
        if not is_stable:
            self.previous_frame = frame
            return {'success': False, 'error': 'Frame not stable'}
        
        # Detect pieces
        detections = self.detect_pieces(frame)
        
        # Update history
        self.update_detection_history(detections)
        
        # Get stable detections
        stable_detections = self.get_stable_detections()
        
        # Map to board positions
        board_state = self.map_to_board_positions(stable_detections)
        
        # Update previous frame
        self.previous_frame = frame
        
        return {
            'success': True,
            'frame': frame,
            'detections': detections,
            'stable_detections': stable_detections,
            'board_state': board_state,
            'is_stable': is_stable
        }
    
    def run_detection_loop(self, max_frames: Optional[int] = None) -> List[Dict]:
        """
        Run detection loop for specified number of frames.
        
        Args:
            max_frames: Maximum number of frames to process
            
        Returns:
            List of detection results
        """
        if not self.start_camera():
            return []
        
        results = []
        frame_count = 0
        
        try:
            while True:
                if max_frames and frame_count >= max_frames:
                    break
                
                result = self.process_frame()
                results.append(result)
                
                if result['success']:
                    self.logger.log_info(
                        f"Frame {frame_count}: {len(result['detections'])} detections, "
                        f"{len(result['stable_detections'])} stable",
                        "run_detection_loop"
                    )
                
                frame_count += 1
                
        except KeyboardInterrupt:
            self.logger.log_info("Detection loop interrupted by user", "run_detection_loop")
        finally:
            self.stop_camera()
        
        return results
    
    def get_detector_info(self) -> Dict:
        """Get detector information."""
        return {
            'camera_index': self.camera_index,
            'frame_stabilization': self.frame_stabilization,
            'stabilization_threshold': self.stabilization_threshold,
            'min_detections': self.min_detections,
            'detector_info': self.detector.get_model_info() if hasattr(self.detector, 'get_model_info') else {}
        }