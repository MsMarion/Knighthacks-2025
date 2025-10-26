"""
Gradio web interface for chess vision system.

Implements the main web application with tabs for detection,
training, datasets, and system information.
"""

import gradio as gr
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import time

# Import chess vision components
from ..models.detector_yolo import YOLOChessDetector
from ..models.detector_inception import InceptionChessDetector
from ..models.piece_classifier import PieceClassifier
from ..inference.live_detector import LiveChessDetector
from ..inference.board_predictor import BoardPredictor
from ..inference.move_validator import MoveValidator
from ..utils.logger import get_global_logger


class ChessVisionApp:
    """
    Main chess vision application.
    
    Provides web interface for chess piece detection,
    training, and system management.
    """
    
    def __init__(self):
        """Initialize chess vision application."""
        self.logger = get_global_logger()
        self.detector = None
        self.classifier = None
        self.live_detector = None
        self.board_predictor = None
        self.move_validator = None
        
        # Initialize components
        self._initialize_components()
    
    def _initialize_components(self):
        """Initialize chess vision components."""
        try:
            # Initialize move validator
            self.move_validator = MoveValidator()
            
            # Initialize board predictor
            self.board_predictor = BoardPredictor()
            
            self.logger.log_info("Components initialized successfully", "ChessVisionApp")
            
        except Exception as e:
            self.logger.log_error(e, "ChessVisionApp._initialize_components")
    
    def load_detector_model(self, model_path: str, model_type: str = "yolo") -> bool:
        """
        Load detector model.
        
        Args:
            model_path: Path to model file
            model_type: Type of model ('yolo' or 'inception')
            
        Returns:
            True if model loaded successfully
        """
        try:
            if model_type == "yolo":
                self.detector = YOLOChessDetector(model_path)
            elif model_type == "inception":
                self.detector = InceptionChessDetector(model_path)
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
            
            self.logger.log_model_load(model_path, model_type)
            return True
            
        except Exception as e:
            self.logger.log_error(e, "ChessVisionApp.load_detector_model")
            return False
    
    def load_classifier_model(self, model_path: str) -> bool:
        """
        Load classifier model.
        
        Args:
            model_path: Path to model file
            
        Returns:
            True if model loaded successfully
        """
        try:
            self.classifier = PieceClassifier(model_path)
            self.logger.log_model_load(model_path, "classifier")
            return True
            
        except Exception as e:
            self.logger.log_error(e, "ChessVisionApp.load_classifier_model")
            return False
    
    def detect_pieces(self, image: np.ndarray) -> Dict:
        """
        Detect chess pieces in image.
        
        Args:
            image: Input image
            
        Returns:
            Dictionary containing detection results
        """
        if self.detector is None:
            return {
                'success': False,
                'error': 'No detector model loaded',
                'detections': [],
                'visualization': image
            }
        
        try:
            # Run detection
            results = self.detector.detect(image, return_crops=True)
            detections = results['detections']
            
            # Create visualization
            vis_image = self.detector.visualize_detections(
                image, detections, show_confidence=True, show_class=True
            )
            
            return {
                'success': True,
                'detections': detections,
                'num_detections': len(detections),
                'visualization': vis_image
            }
            
        except Exception as e:
            self.logger.log_error(e, "ChessVisionApp.detect_pieces")
            return {
                'success': False,
                'error': str(e),
                'detections': [],
                'visualization': image
            }
    
    def classify_pieces(self, image: np.ndarray) -> Dict:
        """
        Classify chess pieces in image.
        
        Args:
            image: Input image
            
        Returns:
            Dictionary containing classification results
        """
        if self.classifier is None:
            return {
                'success': False,
                'error': 'No classifier model loaded',
                'classification': None
            }
        
        try:
            # Run classification
            result = self.classifier.classify(image, return_probabilities=True)
            
            return {
                'success': True,
                'classification': result
            }
            
        except Exception as e:
            self.logger.log_error(e, "ChessVisionApp.classify_pieces")
            return {
                'success': False,
                'error': str(e),
                'classification': None
            }
    
    def predict_board_state(self, image: np.ndarray) -> Dict:
        """
        Predict board state from image.
        
        Args:
            image: Input image
            
        Returns:
            Dictionary containing board state prediction
        """
        try:
            # Detect pieces first
            detection_results = self.detect_pieces(image)
            if not detection_results['success']:
                return detection_results
            
            detections = detection_results['detections']
            
            # Create board position mapping (simplified)
            board_positions = self._create_board_mapping(image)
            
            # Predict board state
            board_results = self.board_predictor.predict_board_state(
                detections, board_positions
            )
            
            return {
                'success': True,
                'detections': detections,
                'board_state': board_results,
                'fen': board_results.get('fen', ''),
                'is_valid': board_results.get('is_valid', False)
            }
            
        except Exception as e:
            self.logger.log_error(e, "ChessVisionApp.predict_board_state")
            return {
                'success': False,
                'error': str(e),
                'board_state': None
            }
    
    def _create_board_mapping(self, image: np.ndarray) -> Dict[str, Tuple[int, int]]:
        """
        Create board position mapping from image.
        
        Args:
            image: Input image
            
        Returns:
            Dictionary mapping board positions to coordinates
        """
        # This is a simplified implementation
        # In practice, you would use computer vision to detect the board
        h, w = image.shape[:2]
        
        # Create a simple 8x8 grid mapping
        board_positions = {}
        square_size = min(h, w) // 8
        
        for row in range(8):
            for col in range(8):
                square_name = chr(ord('a') + col) + str(8 - row)
                x = col * square_size + square_size // 2
                y = row * square_size + square_size // 2
                board_positions[square_name] = (x, y)
        
        return board_positions
    
    def get_system_info(self) -> Dict:
        """Get system information."""
        info = {
            'detector_loaded': self.detector is not None,
            'classifier_loaded': self.classifier is not None,
            'live_detector_loaded': self.live_detector is not None,
            'board_predictor_loaded': self.board_predictor is not None,
            'move_validator_loaded': self.move_validator is not None
        }
        
        if self.detector:
            info['detector_info'] = self.detector.get_model_info()
        
        if self.classifier:
            info['classifier_info'] = self.classifier.get_model_info()
        
        return info


def create_ui() -> gr.Blocks:
    """
    Create Gradio web interface.
    
    Returns:
        Gradio Blocks interface
    """
    app = ChessVisionApp()
    
    with gr.Blocks(
        title="Chess Vision System",
        theme=gr.themes.Soft(),
        css="""
        .gradio-container {
            max-width: 1200px !important;
        }
        .tab-nav {
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
        """
    ) as interface:
        
        gr.Markdown(
            """
            # 🏁 Chess Vision System
            
            Real-time chess piece detection and board state analysis using deep learning.
            Upload an image or use your webcam to detect chess pieces and analyze positions.
            """
        )
        
        with gr.Tabs():
            
            # Detection Tab
            with gr.Tab("🔍 Detection", id="detection"):
                gr.Markdown("### Chess Piece Detection")
                
                with gr.Row():
                    with gr.Column(scale=1):
                        detection_image = gr.Image(
                            label="Upload Image",
                            type="numpy",
                            height=400
                        )
                        
                        detection_btn = gr.Button(
                            "Detect Pieces",
                            variant="primary",
                            size="lg"
                        )
                        
                        model_type = gr.Radio(
                            choices=["yolo", "inception"],
                            value="yolo",
                            label="Model Type"
                        )
                        
                        model_path = gr.Textbox(
                            label="Model Path (optional)",
                            placeholder="path/to/model.pt"
                        )
                    
                    with gr.Column(scale=1):
                        detection_output = gr.Image(
                            label="Detection Results",
                            height=400
                        )
                        
                        detection_info = gr.JSON(
                            label="Detection Information"
                        )
                
                def detect_pieces_wrapper(image, model_type, model_path):
                    if image is None:
                        return None, {"error": "No image provided"}
                    
                    # Load model if path provided
                    if model_path and model_path.strip():
                        app.load_detector_model(model_path, model_type)
                    
                    # Run detection
                    results = app.detect_pieces(image)
                    return results['visualization'], results
                
                detection_btn.click(
                    detect_pieces_wrapper,
                    inputs=[detection_image, model_type, model_path],
                    outputs=[detection_output, detection_info]
                )
            
            # Board Analysis Tab
            with gr.Tab("♟️ Board Analysis", id="board"):
                gr.Markdown("### Board State Analysis")
                
                with gr.Row():
                    with gr.Column(scale=1):
                        board_image = gr.Image(
                            label="Upload Board Image",
                            type="numpy",
                            height=400
                        )
                        
                        analyze_btn = gr.Button(
                            "Analyze Board",
                            variant="primary",
                            size="lg"
                        )
                    
                    with gr.Column(scale=1):
                        board_output = gr.Image(
                            label="Board Analysis",
                            height=400
                        )
                        
                        fen_output = gr.Textbox(
                            label="FEN String",
                            interactive=False
                        )
                        
                        board_info = gr.JSON(
                            label="Board Information"
                        )
                
                def analyze_board_wrapper(image):
                    if image is None:
                        return None, "", {"error": "No image provided"}
                    
                    results = app.predict_board_state(image)
                    return results['visualization'], results.get('fen', ''), results
                
                analyze_btn.click(
                    analyze_board_wrapper,
                    inputs=[board_image],
                    outputs=[board_output, fen_output, board_info]
                )
            
            # System Info Tab
            with gr.Tab("ℹ️ System Info", id="info"):
                gr.Markdown("### System Information")
                
                system_info = gr.JSON(
                    label="System Status",
                    value=app.get_system_info()
                )
                
                refresh_btn = gr.Button("Refresh Info")
                
                refresh_btn.click(
                    lambda: app.get_system_info(),
                    outputs=system_info
                )
        
        # Footer
        gr.Markdown(
            """
            ---
            **Chess Vision System** - Powered by deep learning and computer vision
            """
        )
    
    return interface


# For backward compatibility
def create_ui_legacy():
    """Legacy UI creation function."""
    return create_ui()