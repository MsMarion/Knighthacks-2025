"""
Test suite for deep learning models.

Tests the functionality of YOLO and Inception detectors,
piece classifiers, and model loading.
"""

import pytest
import numpy as np
from pathlib import Path
import sys
import tempfile
import os

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from models.detector_yolo import YOLOChessDetector
from models.detector_inception import InceptionChessDetector
from models.piece_classifier import PieceClassifier


class TestYOLOChessDetector:
    """Test YOLO chess detector functionality."""
    
    def test_initialization(self):
        """Test detector initialization."""
        detector = YOLOChessDetector()
        assert detector.device is not None
        assert detector.confidence_threshold == 0.5
        assert detector.iou_threshold == 0.45
        assert len(detector.class_names) == 12
    
    def test_device_setup(self):
        """Test device setup."""
        detector = YOLOChessDetector(device="cpu")
        assert detector.device == "cpu"
        
        detector2 = YOLOChessDetector(device="auto")
        assert detector2.device in ["cpu", "cuda"]
    
    def test_class_names(self):
        """Test class names."""
        detector = YOLOChessDetector()
        expected_classes = [
            'white_pawn', 'white_rook', 'white_knight', 'white_bishop', 'white_queen', 'white_king',
            'black_pawn', 'black_rook', 'black_knight', 'black_bishop', 'black_queen', 'black_king'
        ]
        assert detector.class_names == expected_classes
    
    def test_model_info(self):
        """Test model information."""
        detector = YOLOChessDetector()
        info = detector.get_model_info()
        
        assert "status" in info
        assert "device" in info
        assert "confidence_threshold" in info
        assert "iou_threshold" in info
        assert "class_names" in info
        assert "num_classes" in info
    
    def test_detect_without_model(self):
        """Test detection without loaded model."""
        detector = YOLOChessDetector()
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        with pytest.raises(RuntimeError, match="Model not loaded"):
            detector.detect(image)
    
    def test_detect_pieces_without_model(self):
        """Test piece detection without loaded model."""
        detector = YOLOChessDetector()
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        with pytest.raises(RuntimeError, match="Model not loaded"):
            detector.detect_pieces(image)
    
    def test_get_piece_centers_without_model(self):
        """Test piece centers without loaded model."""
        detector = YOLOChessDetector()
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        with pytest.raises(RuntimeError, match="Model not loaded"):
            detector.get_piece_centers(image)
    
    def test_visualize_detections(self):
        """Test detection visualization."""
        detector = YOLOChessDetector()
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        # Mock detections
        detections = [
            {
                'bbox': [100, 100, 200, 200],
                'confidence': 0.8,
                'class_name': 'white_pawn',
                'center': [150, 150]
            }
        ]
        
        vis_image = detector.visualize_detections(image, detections)
        assert vis_image.shape == image.shape
        assert vis_image.dtype == image.dtype


class TestInceptionChessDetector:
    """Test Inception chess detector functionality."""
    
    def test_initialization(self):
        """Test detector initialization."""
        detector = InceptionChessDetector()
        assert detector.backend in ["torch", "tensorflow"]
        assert detector.device is not None
        assert detector.confidence_threshold == 0.5
        assert detector.input_size == (299, 299)
        assert len(detector.class_names) == 12
    
    def test_backend_setup(self):
        """Test backend setup."""
        detector = InceptionChessDetector(backend="torch")
        assert detector.backend == "torch"
        
        detector2 = InceptionChessDetector(backend="tensorflow")
        assert detector2.backend == "tensorflow"
    
    def test_input_size(self):
        """Test input size configuration."""
        detector = InceptionChessDetector(input_size=(224, 224))
        assert detector.input_size == (224, 224)
    
    def test_model_info(self):
        """Test model information."""
        detector = InceptionChessDetector()
        info = detector.get_model_info()
        
        assert "status" in info
        assert "backend" in info
        assert "device" in info
        assert "confidence_threshold" in info
        assert "input_size" in info
        assert "class_names" in info
        assert "num_classes" in info
    
    def test_detect_without_model(self):
        """Test detection without loaded model."""
        detector = InceptionChessDetector()
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        with pytest.raises(RuntimeError, match="Model not loaded"):
            detector.detect(image)
    
    def test_preprocess_image(self):
        """Test image preprocessing."""
        detector = InceptionChessDetector()
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        processed = detector.preprocess_image(image)
        
        if detector.backend == "torch":
            assert processed.shape[0] == 1  # Batch dimension
            assert processed.shape[1] == 3  # Channels
            assert processed.shape[2] == detector.input_size[0]  # Height
            assert processed.shape[3] == detector.input_size[1]  # Width
        elif detector.backend == "tensorflow":
            assert processed.shape[0] == 1  # Batch dimension
            assert processed.shape[1] == detector.input_size[0]  # Height
            assert processed.shape[2] == detector.input_size[1]  # Width
            assert processed.shape[3] == 3  # Channels


class TestPieceClassifier:
    """Test piece classifier functionality."""
    
    def test_initialization(self):
        """Test classifier initialization."""
        classifier = PieceClassifier()
        assert classifier.architecture in ["resnet50", "vgg16", "mobilenet_v2"]
        assert classifier.backend in ["torch", "tensorflow"]
        assert classifier.device is not None
        assert classifier.confidence_threshold == 0.5
        assert classifier.input_size == (224, 224)
        assert len(classifier.class_names) == 12
    
    def test_architecture_setup(self):
        """Test architecture setup."""
        classifier = PieceClassifier(architecture="resnet50")
        assert classifier.architecture == "resnet50"
        
        classifier2 = PieceClassifier(architecture="vgg16")
        assert classifier2.architecture == "vgg16"
        
        classifier3 = PieceClassifier(architecture="mobilenet_v2")
        assert classifier3.architecture == "mobilenet_v2"
    
    def test_backend_setup(self):
        """Test backend setup."""
        classifier = PieceClassifier(backend="torch")
        assert classifier.backend == "torch"
        
        classifier2 = PieceClassifier(backend="tensorflow")
        assert classifier2.backend == "tensorflow"
    
    def test_input_size(self):
        """Test input size configuration."""
        classifier = PieceClassifier(input_size=(299, 299))
        assert classifier.input_size == (299, 299)
    
    def test_model_info(self):
        """Test model information."""
        classifier = PieceClassifier()
        info = classifier.get_model_info()
        
        assert "status" in info
        assert "architecture" in info
        assert "backend" in info
        assert "device" in info
        assert "confidence_threshold" in info
        assert "input_size" in info
        assert "class_names" in info
        assert "num_classes" in info
    
    def test_classify_without_model(self):
        """Test classification without loaded model."""
        classifier = PieceClassifier()
        image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        with pytest.raises(RuntimeError, match="Model not loaded"):
            classifier.classify(image)
    
    def test_classify_batch_without_model(self):
        """Test batch classification without loaded model."""
        classifier = PieceClassifier()
        images = [np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8) for _ in range(3)]
        
        with pytest.raises(RuntimeError, match="Model not loaded"):
            classifier.classify_batch(images)
    
    def test_preprocess_image(self):
        """Test image preprocessing."""
        classifier = PieceClassifier()
        image = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
        
        processed = classifier.preprocess_image(image)
        
        if classifier.backend == "torch":
            assert processed.shape[0] == 1  # Batch dimension
            assert processed.shape[1] == 3  # Channels
            assert processed.shape[2] == classifier.input_size[0]  # Height
            assert processed.shape[3] == classifier.input_size[1]  # Width
        elif classifier.backend == "tensorflow":
            assert processed.shape[0] == 1  # Batch dimension
            assert processed.shape[1] == classifier.input_size[0]  # Height
            assert processed.shape[2] == classifier.input_size[1]  # Width
            assert processed.shape[3] == 3  # Channels


class TestModelIntegration:
    """Test model integration and compatibility."""
    
    def test_yolo_inception_compatibility(self):
        """Test YOLO and Inception detector compatibility."""
        yolo_detector = YOLOChessDetector()
        inception_detector = InceptionChessDetector()
        
        # Both should have same class names
        assert yolo_detector.class_names == inception_detector.class_names
        
        # Both should have same number of classes
        assert len(yolo_detector.class_names) == len(inception_detector.class_names)
    
    def test_classifier_compatibility(self):
        """Test classifier compatibility with detectors."""
        classifier = PieceClassifier()
        yolo_detector = YOLOChessDetector()
        
        # Classifier should have same class names as detectors
        assert classifier.class_names == yolo_detector.class_names
    
    def test_model_loading_error_handling(self):
        """Test model loading error handling."""
        detector = YOLOChessDetector()
        
        # Test loading non-existent model
        with pytest.raises(FileNotFoundError):
            detector.load_model("non_existent_model.pt")
        
        # Test loading invalid model file
        with tempfile.NamedTemporaryFile(suffix=".pt", delete=False) as tmp_file:
            tmp_file.write(b"invalid model data")
            tmp_file.flush()
            
            with pytest.raises(RuntimeError):
                detector.load_model(tmp_file.name)
            
            os.unlink(tmp_file.name)
    
    def test_model_info_consistency(self):
        """Test model info consistency."""
        detector = YOLOChessDetector()
        classifier = PieceClassifier()
        
        detector_info = detector.get_model_info()
        classifier_info = classifier.get_model_info()
        
        # Both should have status field
        assert "status" in detector_info
        assert "status" in classifier_info
        
        # Both should have device field
        assert "device" in detector_info
        assert "device" in classifier_info
        
        # Both should have confidence_threshold field
        assert "confidence_threshold" in detector_info
        assert "confidence_threshold" in classifier_info


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])