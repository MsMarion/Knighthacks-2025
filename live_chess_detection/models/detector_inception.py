"""
InceptionV3-based chess piece detector.

Implements object detection for chess pieces using InceptionV3 architecture
with support for both PyTorch and TensorFlow backends.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

try:
    import torch
    import torch.nn as nn
    import torchvision.transforms as transforms
    from torchvision.models import inception_v3
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None
    nn = None
    transforms = None
    inception_v3 = None

try:
    import tensorflow as tf
    from tensorflow.keras.applications import InceptionV3
    from tensorflow.keras.applications.inception_v3 import preprocess_input
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    tf = None
    InceptionV3 = None
    preprocess_input = None


class InceptionChessDetector:
    """
    InceptionV3-based chess piece detector.
    
    Provides object detection capabilities for chess pieces
    using InceptionV3 architecture with customizable backends.
    """
    
    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        backend: str = "torch",
        device: str = "auto",
        confidence_threshold: float = 0.5,
        input_size: Tuple[int, int] = (299, 299)
    ):
        """
        Initialize Inception chess detector.
        
        Args:
            model_path: Path to trained model weights
            backend: Backend to use ('torch' or 'tensorflow')
            device: Device to run inference on
            confidence_threshold: Minimum confidence for detections
            input_size: Input image size (height, width)
        """
        self.model_path = model_path
        self.backend = backend
        self.device = self._setup_device(device)
        self.confidence_threshold = confidence_threshold
        self.input_size = input_size
        
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
        Load Inception model from file.
        
        Args:
            model_path: Path to model file
        """
        model_path = Path(model_path)
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        
        if self.backend == "torch":
            self._load_torch_model(model_path)
        elif self.backend == "tensorflow":
            self._load_tf_model(model_path)
        else:
            raise ValueError(f"Unsupported backend: {self.backend}")
    
    def _load_torch_model(self, model_path: Path):
        """Load PyTorch model."""
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is required for torch backend")
        
        try:
            # Load model architecture
            self.model = inception_v3(pretrained=False, num_classes=len(self.class_names))
            
            # Load weights
            checkpoint = torch.load(model_path, map_location=self.device)
            if 'model_state_dict' in checkpoint:
                self.model.load_state_dict(checkpoint['model_state_dict'])
            else:
                self.model.load_state_dict(checkpoint)
            
            self.model.to(self.device)
            self.model.eval()
            
        except Exception as e:
            raise RuntimeError(f"Failed to load PyTorch model: {e}")
    
    def _load_tf_model(self, model_path: Path):
        """Load TensorFlow model."""
        if not TF_AVAILABLE:
            raise ImportError("TensorFlow is required for tensorflow backend")
        
        try:
            # Load model
            self.model = tf.keras.models.load_model(str(model_path))
            
        except Exception as e:
            raise RuntimeError(f"Failed to load TensorFlow model: {e}")
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for Inception model.
        
        Args:
            image: Input image
            
        Returns:
            Preprocessed image
        """
        if self.backend == "torch":
            return self._preprocess_torch(image)
        elif self.backend == "tensorflow":
            return self._preprocess_tf(image)
        else:
            raise ValueError(f"Unsupported backend: {self.backend}")
    
    def _preprocess_torch(self, image: np.ndarray) -> torch.Tensor:
        """Preprocess image for PyTorch."""
        # Convert BGR to RGB
        if len(image.shape) == 3 and image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Resize image
        image = cv2.resize(image, self.input_size)
        
        # Convert to tensor
        image = torch.from_numpy(image).float() / 255.0
        
        # Normalize for InceptionV3
        mean = [0.485, 0.456, 0.406]
        std = [0.229, 0.224, 0.225]
        
        for i in range(3):
            image[:, :, i] = (image[:, :, i] - mean[i]) / std[i]
        
        # Add batch dimension and rearrange dimensions
        image = image.permute(2, 0, 1).unsqueeze(0)
        
        return image.to(self.device)
    
    def _preprocess_tf(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for TensorFlow."""
        # Convert BGR to RGB
        if len(image.shape) == 3 and image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Resize image
        image = cv2.resize(image, self.input_size)
        
        # Preprocess for InceptionV3
        image = preprocess_input(image.astype(np.float32))
        
        # Add batch dimension
        image = np.expand_dims(image, axis=0)
        
        return image
    
    def detect(
        self,
        image: np.ndarray,
        return_probabilities: bool = False
    ) -> Dict[str, Union[List[Dict], np.ndarray]]:
        """
        Detect chess pieces in image.
        
        Args:
            image: Input image
            return_probabilities: Whether to return class probabilities
            
        Returns:
            Dictionary containing detections and optional probabilities
        """
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        # Preprocess image
        processed_image = self.preprocess_image(image)
        
        # Run inference
        if self.backend == "torch":
            with torch.no_grad():
                outputs = self.model(processed_image)
                probabilities = torch.softmax(outputs, dim=1)
                probabilities = probabilities.cpu().numpy()[0]
        elif self.backend == "tensorflow":
            probabilities = self.model.predict(processed_image)[0]
        else:
            raise ValueError(f"Unsupported backend: {self.backend}")
        
        # Find detections above threshold
        detections = []
        for class_id, prob in enumerate(probabilities):
            if prob >= self.confidence_threshold:
                detection = {
                    'class_id': class_id,
                    'class_name': self.class_names[class_id] if class_id < len(self.class_names) else f'class_{class_id}',
                    'confidence': float(prob)
                }
                detections.append(detection)
        
        result_dict = {
            'detections': detections,
            'num_detections': len(detections)
        }
        
        if return_probabilities:
            result_dict['probabilities'] = probabilities
        
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
    
    def get_model_info(self) -> Dict:
        """Get model information."""
        if self.model is None:
            return {"status": "not_loaded"}
        
        return {
            "status": "loaded",
            "backend": self.backend,
            "device": self.device,
            "confidence_threshold": self.confidence_threshold,
            "input_size": self.input_size,
            "class_names": self.class_names,
            "num_classes": len(self.class_names)
        }