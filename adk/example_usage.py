#!/usr/bin/env python3
"""
Example usage of Gemini ER-1.5 agents
This demonstrates how to use the agents for robotics tasks
"""

import asyncio
import os
from pathlib import Path
from agent import vision_agent, motion_agent, coordination_agent

async def example_chess_detection():
    """Example: Use vision agent to detect chess pieces"""
    print("🎯 Example: Chess Piece Detection")
    
    # Load a sample chess board image
    image_path = Path("sample_chess_board.jpg")
    if not image_path.exists():
        print("⚠️ Please provide a sample_chess_board.jpg image")
        return
    
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    
    # Create a prompt for chess piece detection
    prompt = """
    Analyze this chess board image and identify all pieces.
    Return the positions and types of pieces in JSON format.
    Focus on piece detection for robotic manipulation.
    """
    
    try:
        # Process with vision agent
        result = await vision_agent.process_with_thinking(image_bytes, prompt)
        print(f"✅ Vision agent result: {result}")
        
    except Exception as e:
        print(f"❌ Vision agent error: {e}")

async def example_motion_planning():
    """Example: Use motion agent for trajectory planning"""
    print("\n🤖 Example: Motion Planning")
    
    # Create a simple test image
    import io
    from PIL import Image
    
    # Create a test image with objects
    img = Image.new('RGB', (200, 200), color='white')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes = img_bytes.getvalue()
    
    prompt = """
    Plan a trajectory to move a robotic arm from point A to point B.
    Consider collision avoidance and smooth motion.
    Return trajectory waypoints in JSON format.
    """
    
    try:
        result = await motion_agent.process_with_thinking(img_bytes, prompt)
        print(f"✅ Motion agent result: {result}")
        
    except Exception as e:
        print(f"❌ Motion agent error: {e}")

async def example_coordination():
    """Example: Use coordination agent for task orchestration"""
    print("\n🎭 Example: Task Coordination")
    
    # Create a test image
    import io
    from PIL import Image
    
    img = Image.new('RGB', (200, 200), color='white')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes = img_bytes.getvalue()
    
    prompt = """
    Coordinate a multi-step robotic task:
    1. Detect objects in the scene
    2. Plan motion trajectories
    3. Execute the task sequence
    Return a step-by-step plan in JSON format.
    """
    
    try:
        result = await coordination_agent.process_with_thinking(img_bytes, prompt)
        print(f"✅ Coordination agent result: {result}")
        
    except Exception as e:
        print(f"❌ Coordination agent error: {e}")

async def main():
    """Run example scenarios"""
    print("🚀 Gemini ER-1.5 Agent Examples")
    print("=" * 40)
    
    # Check if API key is set
    if not os.getenv("GEMINI_API_KEY"):
        print("⚠️ Please set GEMINI_API_KEY environment variable")
        print("   export GEMINI_API_KEY='your-api-key-here'")
        return
    
    # Run examples
    await example_chess_detection()
    await example_motion_planning()
    await example_coordination()
    
    print("\n✅ All examples completed!")
    print("\nTo see real-time agent status:")
    print("1. Run: python adk/agent.py")
    print("2. Open frontend and go to Agent Observatory")
    print("3. Watch the graph visualization for live updates")

if __name__ == "__main__":
    asyncio.run(main())
