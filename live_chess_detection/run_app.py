"""
Main application launcher for chess vision system.

This script launches the Gradio web interface for the
chess vision system.
"""

import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Import and launch the UI
from ui.app import create_ui

if __name__ == "__main__":
    # Create and launch the UI
    app = create_ui()
    app.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        debug=True
    )