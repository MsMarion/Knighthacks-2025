"""
Inference module for chess vision system.

This package contains components for live detection,
board state prediction, and move validation.
"""

__version__ = "0.1.0"

# Import main inference classes
from .live_detector import LiveChessDetector
from .board_predictor import BoardPredictor
from .move_validator import MoveValidator

__all__ = [
    'LiveChessDetector',
    'BoardPredictor',
    'MoveValidator'
]