"""
Image processing utilities for chess board detection.

Provides functions for preprocessing images, detecting board corners,
perspective correction, and piece localization.
"""

import cv2
import numpy as np
from typing import List, Optional, Tuple, Union


def preprocess_image(
    image: np.ndarray,
    target_size: Tuple[int, int] = (1024, 1024),
    normalize: bool = True
) -> np.ndarray:
    """
    Preprocess image for detection.
    
    Args:
        image: Input image
        target_size: Target size (width, height)
        normalize: Whether to normalize pixel values
        
    Returns:
        Preprocessed image
    """
    # Resize image
    processed = cv2.resize(image, target_size)
    
    # Convert to RGB if needed
    if len(processed.shape) == 3 and processed.shape[2] == 3:
        processed = cv2.cvtColor(processed, cv2.COLOR_BGR2RGB)
    
    # Normalize if requested
    if normalize:
        processed = processed.astype(np.float32) / 255.0
    
    return processed


def detect_board_corners(
    image: np.ndarray,
    method: str = 'contours'
) -> Optional[np.ndarray]:
    """
    Detect chess board corners in image.
    
    Args:
        image: Input image
        method: Detection method ('contours', 'hough', 'template')
        
    Returns:
        4x2 array of corner coordinates or None
    """
    if method == 'contours':
        return _detect_corners_contours(image)
    elif method == 'hough':
        return _detect_corners_hough(image)
    elif method == 'template':
        return _detect_corners_template(image)
    else:
        raise ValueError(f"Unknown detection method: {method}")


def _detect_corners_contours(image: np.ndarray) -> Optional[np.ndarray]:
    """Detect corners using contour analysis."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply Canny edge detection
    edges = cv2.Canny(blurred, 50, 150)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Find largest contour (likely the board)
    if not contours:
        return None
    
    largest_contour = max(contours, key=cv2.contourArea)
    
    # Approximate contour to polygon
    epsilon = 0.02 * cv2.arcLength(largest_contour, True)
    approx = cv2.approxPolyDP(largest_contour, epsilon, True)
    
    # Check if we have 4 corners
    if len(approx) == 4:
        corners = approx.reshape(4, 2)
        return corners
    
    return None


def _detect_corners_hough(image: np.ndarray) -> Optional[np.ndarray]:
    """Detect corners using Hough line detection."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Detect lines
    lines = cv2.HoughLinesP(blurred, 1, np.pi/180, threshold=100, 
                           minLineLength=100, maxLineGap=10)
    
    if lines is None:
        return None
    
    # Find intersection points
    intersections = []
    for i in range(len(lines)):
        for j in range(i + 1, len(lines)):
            x1, y1, x2, y2 = lines[i][0]
            x3, y3, x4, y4 = lines[j][0]
            
            # Calculate intersection
            denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
            if abs(denom) < 1e-10:
                continue
            
            t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
            u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom
            
            if 0 <= t <= 1 and 0 <= u <= 1:
                x = int(x1 + t * (x2 - x1))
                y = int(y1 + t * (y2 - y1))
                intersections.append([x, y])
    
    if len(intersections) < 4:
        return None
    
    # Find 4 corners from intersections
    intersections = np.array(intersections)
    
    # Simple approach: find extreme points
    corners = np.array([
        intersections[np.argmin(intersections[:, 0] + intersections[:, 1])],  # Top-left
        intersections[np.argmax(intersections[:, 0] - intersections[:, 1])],  # Top-right
        intersections[np.argmax(intersections[:, 0] + intersections[:, 1])],  # Bottom-right
        intersections[np.argmin(intersections[:, 0] - intersections[:, 1])]   # Bottom-left
    ])
    
    return corners


def _detect_corners_template(image: np.ndarray) -> Optional[np.ndarray]:
    """Detect corners using template matching."""
    # This is a placeholder for template matching approach
    # In practice, you would use a chess board template
    return None


def perspective_correct(
    image: np.ndarray,
    corners: np.ndarray,
    output_size: Tuple[int, int] = (800, 800)
) -> np.ndarray:
    """
    Apply perspective correction to board image.
    
    Args:
        image: Input image
        corners: 4x2 array of corner coordinates
        output_size: Output image size (width, height)
        
    Returns:
        Perspective-corrected image
    """
    # Define destination points (square board)
    dst_points = np.array([
        [0, 0],
        [output_size[0] - 1, 0],
        [output_size[0] - 1, output_size[1] - 1],
        [0, output_size[1] - 1]
    ], dtype=np.float32)
    
    # Calculate perspective transform
    transform_matrix = cv2.getPerspectiveTransform(
        corners.astype(np.float32), dst_points
    )
    
    # Apply transformation
    corrected = cv2.warpPerspective(
        image, transform_matrix, output_size
    )
    
    return corrected


def extract_squares(
    board_image: np.ndarray,
    board_size: int = 8
) -> List[np.ndarray]:
    """
    Extract individual squares from board image.
    
    Args:
        board_image: Perspective-corrected board image
        board_size: Number of squares per side (default 8)
        
    Returns:
        List of 64 square images
    """
    h, w = board_image.shape[:2]
    square_size = h // board_size
    
    squares = []
    for row in range(board_size):
        for col in range(board_size):
            y1 = row * square_size
            y2 = (row + 1) * square_size
            x1 = col * square_size
            x2 = (col + 1) * square_size
            
            square = board_image[y1:y2, x1:x2]
            squares.append(square)
    
    return squares


def enhance_contrast(image: np.ndarray, alpha: float = 1.5) -> np.ndarray:
    """
    Enhance image contrast.
    
    Args:
        image: Input image
        alpha: Contrast factor
        
    Returns:
        Enhanced image
    """
    return cv2.convertScaleAbs(image, alpha=alpha, beta=0)


def apply_gaussian_blur(image: np.ndarray, kernel_size: int = 5) -> np.ndarray:
    """
    Apply Gaussian blur to image.
    
    Args:
        image: Input image
        kernel_size: Blur kernel size
        
    Returns:
        Blurred image
    """
    return cv2.GaussianBlur(image, (kernel_size, kernel_size), 0)


def detect_edges(image: np.ndarray, low_threshold: int = 50, high_threshold: int = 150) -> np.ndarray:
    """
    Detect edges using Canny edge detection.
    
    Args:
        image: Input image
        low_threshold: Lower threshold for edge detection
        high_threshold: Upper threshold for edge detection
        
    Returns:
        Edge image
    """
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image
    
    return cv2.Canny(gray, low_threshold, high_threshold)


def resize_image(image: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
    """
    Resize image to target size.
    
    Args:
        image: Input image
        target_size: Target size (width, height)
        
    Returns:
        Resized image
    """
    return cv2.resize(image, target_size)


def crop_image(image: np.ndarray, x: int, y: int, width: int, height: int) -> np.ndarray:
    """
    Crop image to specified region.
    
    Args:
        image: Input image
        x: X coordinate of top-left corner
        y: Y coordinate of top-left corner
        width: Width of crop region
        height: Height of crop region
        
    Returns:
        Cropped image
    """
    return image[y:y+height, x:x+width]