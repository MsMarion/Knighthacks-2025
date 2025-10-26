"""
Deep learning models for chess piece detection and classification.

This package contains implementations for various neural network
architectures used in chess vision tasks.
"""

__version__ = "0.1.0"

# Import main model classes
from .detector_yolo import YOLOChessDetector
from .detector_inception import InceptionChessDetector
from .piece_classifier import PieceClassifier

__all__ = [
    'YOLOChessDetector',
    'InceptionChessDetector', 
    'PieceClassifier'
]