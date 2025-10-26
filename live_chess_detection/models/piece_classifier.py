"""
Chess piece classifier for individual piece recognition.

Implements classification of chess pieces from cropped images
using various deep learning architectures.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

try:
    import torch
    import torch.nn as nn
    import torchvision.transforms as transforms
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    torch = None
    nn = None
    transforms = None

try:
    import tensorflow as tf
    from tensorflow.keras.applications import ResNet50, VGG16, MobileNetV2
    from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_preprocess
    from tensorflow.keras.applications.vgg16 import preprocess_input as vgg_preprocess
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_preprocess
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    tf = None
    ResNet50 = None
    VGG16 = None
    MobileNetV2 = None


class PieceClassifier:
    """
    Chess piece classifier for individual piece recognition.
    
    Provides classification capabilities for chess pieces
    using various deep learning architectures.
    """
    
    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        architecture: str = "resnet50",
        backend: str = "torch",
        device: str = "auto",
        confidence_threshold: float = 0.5,
        input_size: Tuple[int, int] = (224, 224)
    ):
        """
        Initialize piece classifier.
        
        Args:
            model_path: Path to trained model weights
            architecture: Model architecture ('resnet50', 'vgg16', 'mobilenet_v2')
            backend: Backend to use ('torch' or 'tensorflow')
            device: Device to run inference on
            confidence_threshold: Minimum confidence for predictions
            input_size: Input image size (height, width)
        """
        self.model_path = model_path
        self.architecture = architecture
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
        Load classifier model from file.
        
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
            # Load model
            checkpoint = torch.load(model_path, map_location=self.device)
            
            if 'model_state_dict' in checkpoint:
                self.model = self._create_torch_model()
                self.model.load_state_dict(checkpoint['model_state_dict'])
            else:
                self.model = checkpoint
            
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
    
    def _create_torch_model(self) -> nn.Module:
        """Create PyTorch model architecture."""
        if self.architecture == "resnet50":
            from torchvision.models import resnet50
            model = resnet50(pretrained=False, num_classes=len(self.class_names))
        elif self.architecture == "vgg16":
            from torchvision.models import vgg16
            model = vgg16(pretrained=False, num_classes=len(self.class_names))
        elif self.architecture == "mobilenet_v2":
            from torchvision.models import mobilenet_v2
            model = mobilenet_v2(pretrained=False, num_classes=len(self.class_names))
        else:
            raise ValueError(f"Unsupported architecture: {self.architecture}")
        
        return model
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocess image for classification.
        
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
        
        # Normalize based on architecture
        if self.architecture == "resnet50":
            mean = [0.485, 0.456, 0.406]
            std = [0.229, 0.224, 0.225]
        elif self.architecture == "vgg16":
            mean = [0.485, 0.456, 0.406]
            std = [0.229, 0.224, 0.225]
        elif self.architecture == "mobilenet_v2":
            mean = [0.485, 0.456, 0.406]
            std = [0.229, 0.224, 0.225]
        else:
            mean = [0.5, 0.5, 0.5]
            std = [0.5, 0.5, 0.5]
        
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
        
        # Preprocess based on architecture
        if self.architecture == "resnet50":
            image = resnet_preprocess(image.astype(np.float32))
        elif self.architecture == "vgg16":
            image = vgg_preprocess(image.astype(np.float32))
        elif self.architecture == "mobilenet_v2":
            image = mobilenet_preprocess(image.astype(np.float32))
        else:
            image = image.astype(np.float32) / 255.0
        
        # Add batch dimension
        image = np.expand_dims(image, axis=0)
        
        return image
    
    def classify(
        self,
        image: np.ndarray,
        return_probabilities: bool = False
    ) -> Dict[str, Union[str, float, np.ndarray]]:
        """
        Classify chess piece in image.
        
        Args:
            image: Input image
            return_probabilities: Whether to return class probabilities
            
        Returns:
            Dictionary containing classification results
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
        
        # Get prediction
        predicted_class_id = np.argmax(probabilities)
        predicted_class_name = self.class_names[predicted_class_id] if predicted_class_id < len(self.class_names) else f'class_{predicted_class_id}'
        confidence = float(probabilities[predicted_class_id])
        
        result = {
            'predicted_class_id': int(predicted_class_id),
            'predicted_class_name': predicted_class_name,
            'confidence': confidence,
            'is_confident': confidence >= self.confidence_threshold
        }
        
        if return_probabilities:
            result['probabilities'] = probabilities
        
        return result
    
    def classify_batch(
        self,
        images: List[np.ndarray],
        return_probabilities: bool = False
    ) -> List[Dict]:
        """
        Classify multiple chess pieces.
        
        Args:
            images: List of input images
            return_probabilities: Whether to return class probabilities
            
        Returns:
            List of classification results
        """
        results = []
        for image in images:
            result = self.classify(image, return_probabilities)
            results.append(result)
        
        return results
    
    def get_model_info(self) -> Dict:
        """Get model information."""
        if self.model is None:
            return {"status": "not_loaded"}
        
        return {
            "status": "loaded",
            "architecture": self.architecture,
            "backend": self.backend,
            "device": self.device,
            "confidence_threshold": self.confidence_threshold,
            "input_size": self.input_size,
            "class_names": self.class_names,
            "num_classes": len(self.class_names)
        }