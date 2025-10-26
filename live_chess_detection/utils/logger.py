"""
Logging utilities for chess vision system.

Provides structured logging with different levels and formatters
for debugging and monitoring the system.
"""

import logging
import sys
from pathlib import Path
from typing import Optional


def setup_logger(
    name: str = "chess_vision",
    level: int = logging.INFO,
    log_file: Optional[str] = None,
    format_string: Optional[str] = None
) -> logging.Logger:
    """
    Set up logger with console and optional file output.
    
    Args:
        name: Logger name
        level: Logging level
        log_file: Optional log file path
        format_string: Custom format string
        
    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Default format
    if format_string is None:
        format_string = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    formatter = logging.Formatter(format_string)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


def get_logger(name: str = "chess_vision") -> logging.Logger:
    """
    Get existing logger or create new one.
    
    Args:
        name: Logger name
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


class ChessVisionLogger:
    """
    Custom logger for chess vision operations.
    
    Provides specialized logging methods for different
    types of operations and events.
    """
    
    def __init__(self, name: str = "chess_vision"):
        self.logger = setup_logger(name)
    
    def log_detection(self, num_pieces: int, confidence: float, processing_time: float):
        """Log piece detection results."""
        self.logger.info(
            f"Detection: {num_pieces} pieces found, "
            f"avg confidence: {confidence:.3f}, "
            f"time: {processing_time:.3f}s"
        )
    
    def log_training_start(self, model_name: str, epochs: int, batch_size: int):
        """Log training start."""
        self.logger.info(
            f"Training started: {model_name}, "
            f"epochs: {epochs}, batch_size: {batch_size}"
        )
    
    def log_training_epoch(self, epoch: int, loss: float, accuracy: float):
        """Log training epoch results."""
        self.logger.info(
            f"Epoch {epoch}: loss={loss:.4f}, accuracy={accuracy:.4f}"
        )
    
    def log_training_complete(self, final_accuracy: float, total_time: float):
        """Log training completion."""
        self.logger.info(
            f"Training complete: accuracy={final_accuracy:.4f}, "
            f"total_time={total_time:.2f}s"
        )
    
    def log_model_load(self, model_path: str, model_type: str):
        """Log model loading."""
        self.logger.info(f"Model loaded: {model_path} ({model_type})")
    
    def log_error(self, error: Exception, context: str = ""):
        """Log error with context."""
        self.logger.error(f"Error in {context}: {str(error)}", exc_info=True)
    
    def log_warning(self, message: str, context: str = ""):
        """Log warning with context."""
        self.logger.warning(f"Warning in {context}: {message}")
    
    def log_info(self, message: str, context: str = ""):
        """Log info message with context."""
        self.logger.info(f"Info in {context}: {message}")
    
    def log_debug(self, message: str, context: str = ""):
        """Log debug message with context."""
        self.logger.debug(f"Debug in {context}: {message}")


# Global logger instance
_global_logger = None


def get_global_logger() -> ChessVisionLogger:
    """Get global logger instance."""
    global _global_logger
    if _global_logger is None:
        _global_logger = ChessVisionLogger()
    return _global_logger


def set_global_logger(logger: ChessVisionLogger):
    """Set global logger instance."""
    global _global_logger
    _global_logger = logger