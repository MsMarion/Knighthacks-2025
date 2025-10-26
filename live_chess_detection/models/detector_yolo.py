"""
YOLOv8-based chess piece detector.

Implements object detection for chess pieces using YOLOv8 architecture
with support for both PyTorch and TensorFlow backends.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    YOLO = None

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None


class YOLOChessDetector:
    """
    YOLOv8-based chess piece detector.
    
    Provides object detection capabilities for chess pieces
    using YOLOv8 architecture with customizable backends.
    """
    
    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        device: str = "auto",
        confidence_threshold: float = 0.5,
        iou_threshold: float = 0.45
    ):
        """
        Initialize YOLO chess detector.
        
        Args:
            model_path: Path to trained model weights
            device: Device to run inference on ('cpu', 'cuda', 'auto')
            confidence_threshold: Minimum confidence for detections
            iou_threshold: IoU threshold for NMS
        """
        if not YOLO_AVAILABLE:
            raise ImportError("ultralytics package is required for YOLO detector")
        
        self.model_path = model_path
        self.device = self._setup_device(device)
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold
        
        self.model = None
        self.class_names = self._get_default_class_names()
        
        if model_path:
            self.load_model(model_path)
    
    def _setup_device(self, device: str) -> str:
        """Setup computation device."""
        if device == "auto":
            if TORCH_AVAILABLE and torch.cuda.is_available():
                return "cuda"
            else:
                return "cpu"
        return device
    
    def _get_default_class_names(self) -> List[str]:
        """Get default chess piece class names."""
        return [
            'white_pawn', 'white_rook', 'white_knight', 'white_bishop', 'white_queen', 'white_king',
            'black_pawn', 'black_rook', 'black_knight', 'black_bishop', 'black_queen', 'black_king'
        ]
    
    def load_model(self, model_path: Union[str, Path]):
        """
        Load YOLO model from file.
        
        Args:
            model_path: Path to model file
        """
        model_path = Path(model_path)
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        try:
            self.model = YOLO(str(model_path))
            self.model.to(self.device)
        except Exception as e:
            raise RuntimeError(f"Failed to load model: {e}")
    
    def detect(
        self,
        image: np.ndarray,
        return_crops: bool = False
    ) -> Dict[str, Union[List[Dict], np.ndarray]]:
        """
        Detect chess pieces in image.
        
        Args:
            image: Input image
            return_crops: Whether to return cropped piece images
            
        Returns:
            Dictionary containing detections and optional crops
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        # Run inference
        results = self.model(
            image,
            conf=self.confidence_threshold,
            iou=self.iou_threshold,
            device=self.device
        )
        
        # Parse results
        detections = []
        crops = []
        
        for result in results:
            if result.boxes is not None:
                boxes = result.boxes.xyxy.cpu().numpy()
                confidences = result.boxes.conf.cpu().numpy()
                class_ids = result.boxes.cls.cpu().numpy().astype(int)
                
                for i, (box, conf, class_id) in enumerate(zip(boxes, confidences, class_ids)):
                    x1, y1, x2, y2 = box.astype(int)
                    
                    detection = {
                        'bbox': [x1, y1, x2, y2],
                        'confidence': float(conf),
                        'class_id': int(class_id),
                        'class_name': self.class_names[class_id] if class_id < len(self.class_names) else f'class_{class_id}',
                        'center': [(x1 + x2) // 2, (y1 + y2) // 2]
                    }
                    detections.append(detection)
                    
                    if return_crops:
                        crop = image[y1:y2, x1:x2]
                        crops.append(crop)
        
        result_dict = {
            'detections': detections,
            'num_detections': len(detections)
        }
        
        if return_crops:
            result_dict['crops'] = crops
        
        return result_dict
    
    def detect_pieces(
        self,
        image: np.ndarray,
        filter_by_color: Optional[str] = None
    ) -> List[Dict]:
        """
        Detect chess pieces with optional color filtering.
        
        Args:
            image: Input image
            filter_by_color: Filter by piece color ('white', 'black', None)
            
        Returns:
            List of piece detections
        """
        results = self.detect(image)
        detections = results['detections']
        
        if filter_by_color:
            filtered_detections = []
            for detection in detections:
                class_name = detection['class_name']
                if filter_by_color == 'white' and class_name.startswith('white_'):
                    filtered_detections.append(detection)
                elif filter_by_color == 'black' and class_name.startswith('black_'):
                    filtered_detections.append(detection)
            return filtered_detections
        
        return detections
    
    def get_piece_centers(self, image: np.ndarray) -> List[Tuple[int, int]]:
        """
        Get centers of detected pieces.
        
        Args:
            image: Input image
            
        Returns:
            List of (x, y) center coordinates
        """
        results = self.detect(image)
        centers = []
        
        for detection in results['detections']:
            center = detection['center']
            centers.append((center[0], center[1]))
        
        return centers
    
    def visualize_detections(
        self,
        image: np.ndarray,
        detections: List[Dict],
        show_confidence: bool = True,
        show_class: bool = True
    ) -> np.ndarray:
        """
        Visualize detections on image.
        
        Args:
            image: Input image
            detections: List of detection dictionaries
            show_confidence: Whether to show confidence scores
            show_class: Whether to show class names
            
        Returns:
            Image with visualizations
        """
        vis_image = image.copy()
        
        for detection in detections:
            bbox = detection['bbox']
            confidence = detection['confidence']
            class_name = detection['class_name']
            
            x1, y1, x2, y2 = bbox
            
            # Draw bounding box
            cv2.rectangle(vis_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw label
            label_parts = []
            if show_class:
                label_parts.append(class_name)
            if show_confidence:
                label_parts.append(f"{confidence:.2f}")
            
            if label_parts:
                label = " ".join(label_parts)
                
                # Get text size
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.5
                thickness = 1
                (text_width, text_height), _ = cv2.getTextSize(label, font, font_scale, thickness)
                
                # Draw label background
                cv2.rectangle(
                    vis_image,
                    (x1, y1 - text_height - 5),
                    (x1 + text_width, y1),
                    (0, 255, 0),
                    -1
                )
                
                # Draw label text
                cv2.putText(
                    vis_image,
                    label,
                    (x1, y1 - 5),
                    font,
                    font_scale,
                    (0, 0, 0),
                    thickness
                )
        
        return vis_image
    
    def get_model_info(self) -> Dict:
        """Get model information."""
        if self.model is None:
            return {"status": "not_loaded"}
        
        return {
            "status": "loaded",
            "device": self.device,
            "confidence_threshold": self.confidence_threshold,
            "iou_threshold": self.iou_threshold,
            "class_names": self.class_names,
            "num_classes": len(self.class_names)
        }
