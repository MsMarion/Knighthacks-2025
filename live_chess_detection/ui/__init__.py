"""
User interface module for chess vision system.

This package contains components for the web interface,
including Gradio-based applications and UI utilities.
"""

__version__ = "0.1.0"

# Import main UI classes
from .app import ChessVisionApp, create_ui

__all__ = [
    'ChessVisionApp',
    'create_ui'
]