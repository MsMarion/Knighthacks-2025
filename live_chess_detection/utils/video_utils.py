"""
Video processing utilities for chess vision system.

Provides functions for video capture, frame processing,
and video file handling.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Generator, Optional, Tuple, Union


class VideoCapture:
    """
    Enhanced video capture with additional utilities.
    
    Wraps OpenCV VideoCapture with additional methods
    for chess-specific video processing.
    """
    
    def __init__(self, source: Union[int, str, Path], **kwargs):
        """
        Initialize video capture.
        
        Args:
            source: Video source (camera index, file path, or URL)
            **kwargs: Additional arguments for VideoCapture
        """
        self.source = source
        self.cap = cv2.VideoCapture(source, **kwargs)
        
        if not self.cap.isOpened():
            raise ValueError(f"Could not open video source: {source}")
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.release()
    
    def release(self):
        """Release video capture."""
        if self.cap:
            self.cap.release()
    
    def read(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Read next frame.
        
        Returns:
            (success, frame) tuple
        """
        return self.cap.read()
    
    def get_property(self, prop_id: int) -> float:
        """Get capture property."""
        return self.cap.get(prop_id)
    
    def set_property(self, prop_id: int, value: float) -> bool:
        """Set capture property."""
        return self.cap.set(prop_id, value)
    
    def get_fps(self) -> float:
        """Get video FPS."""
        return self.get_property(cv2.CAP_PROP_FPS)
    
    def get_frame_count(self) -> int:
        """Get total frame count."""
        return int(self.get_property(cv2.CAP_PROP_FRAME_COUNT))
    
    def get_frame_size(self) -> Tuple[int, int]:
        """Get frame dimensions."""
        width = int(self.get_property(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.get_property(cv2.CAP_PROP_FRAME_HEIGHT))
        return width, height
    
    def set_resolution(self, width: int, height: int):
        """Set frame resolution."""
        self.set_property(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.set_property(cv2.CAP_PROP_FRAME_HEIGHT, height)
    
    def set_fps(self, fps: float):
        """Set target FPS."""
        self.set_property(cv2.CAP_PROP_FPS, fps)
    
    def is_opened(self) -> bool:
        """Check if capture is opened."""
        return self.cap.isOpened()


def extract_frames(
    video_path: Union[str, Path],
    output_dir: Union[str, Path],
    frame_interval: int = 1,
    max_frames: Optional[int] = None
) -> int:
    """
    Extract frames from video file.
    
    Args:
        video_path: Path to video file
        output_dir: Directory to save frames
        frame_interval: Extract every Nth frame
        max_frames: Maximum number of frames to extract
        
    Returns:
        Number of frames extracted
    """
    video_path = Path(video_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    with VideoCapture(str(video_path)) as cap:
        frame_count = 0
        extracted_count = 0
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_count % frame_interval == 0:
                frame_filename = output_dir / f"frame_{extracted_count:06d}.jpg"
                cv2.imwrite(str(frame_filename), frame)
                extracted_count += 1
                
                if max_frames and extracted_count >= max_frames:
                    break
            
            frame_count += 1
    
    return extracted_count


def create_video_from_frames(
    frame_dir: Union[str, Path],
    output_path: Union[str, Path],
    fps: float = 30.0,
    frame_pattern: str = "frame_%06d.jpg"
) -> bool:
    """
    Create video from frame images.
    
    Args:
        frame_dir: Directory containing frames
        output_path: Output video path
        fps: Video FPS
        frame_pattern: Frame filename pattern
        
    Returns:
        True if successful
    """
    frame_dir = Path(frame_dir)
    output_path = Path(output_path)
    
    # Get first frame to determine dimensions
    first_frame = None
    for frame_file in sorted(frame_dir.glob("frame_*.jpg")):
        first_frame = cv2.imread(str(frame_file))
        break
    
    if first_frame is None:
        return False
    
    height, width = first_frame.shape[:2]
    
    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(
        str(output_path), fourcc, fps, (width, height)
    )
    
    # Write frames
    for frame_file in sorted(frame_dir.glob("frame_*.jpg")):
        frame = cv2.imread(str(frame_file))
        if frame is not None:
            writer.write(frame)
    
    writer.release()
    return True


def get_video_info(video_path: Union[str, Path]) -> dict:
    """
    Get video information.
    
    Args:
        video_path: Path to video file
        
    Returns:
        Dictionary with video information
    """
    with VideoCapture(str(video_path)) as cap:
        info = {
            'fps': cap.get_fps(),
            'frame_count': cap.get_frame_count(),
            'width': cap.get_frame_size()[0],
            'height': cap.get_frame_size()[1],
            'duration': cap.get_frame_count() / cap.get_fps() if cap.get_fps() > 0 else 0
        }
    
    return info


def stabilize_frame(
    current_frame: np.ndarray,
    previous_frame: Optional[np.ndarray] = None,
    threshold: float = 0.02
) -> Tuple[bool, np.ndarray]:
    """
    Check if frame is stable (no significant movement).
    
    Args:
        current_frame: Current frame
        previous_frame: Previous frame for comparison
        threshold: Movement threshold
        
    Returns:
        (is_stable, processed_frame) tuple
    """
    if previous_frame is None:
        return False, current_frame
    
    # Calculate frame difference
    diff = cv2.absdiff(current_frame, previous_frame)
    mean_diff = np.mean(diff) / 255.0
    
    is_stable = mean_diff < threshold
    
    return is_stable, current_frame


def detect_motion(
    current_frame: np.ndarray,
    previous_frame: np.ndarray,
    threshold: float = 30.0
) -> Tuple[bool, np.ndarray]:
    """
    Detect motion between frames.
    
    Args:
        current_frame: Current frame
        previous_frame: Previous frame
        threshold: Motion threshold
        
    Returns:
        (has_motion, motion_mask) tuple
    """
    # Convert to grayscale
    gray1 = cv2.cvtColor(previous_frame, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(current_frame, cv2.COLOR_BGR2GRAY)
    
    # Calculate difference
    diff = cv2.absdiff(gray1, gray2)
    
    # Apply threshold
    _, motion_mask = cv2.threshold(diff, threshold, 255, cv2.THRESH_BINARY)
    
    # Check if there's significant motion
    motion_pixels = np.sum(motion_mask > 0)
    total_pixels = motion_mask.shape[0] * motion_mask.shape[1]
    motion_ratio = motion_pixels / total_pixels
    
    has_motion = motion_ratio > 0.01  # 1% of pixels changed
    
    return has_motion, motion_mask


def resize_frame(frame: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
    """
    Resize frame to target size.
    
    Args:
        frame: Input frame
        target_size: Target size (width, height)
        
    Returns:
        Resized frame
    """
    return cv2.resize(frame, target_size)


def crop_frame(
    frame: np.ndarray,
    x: int, y: int,
    width: int, height: int
) -> np.ndarray:
    """
    Crop frame to specified region.
    
    Args:
        frame: Input frame
        x: X coordinate of top-left corner
        y: Y coordinate of top-left corner
        width: Width of crop region
        height: Height of crop region
        
    Returns:
        Cropped frame
    """
    return frame[y:y+height, x:x+width]