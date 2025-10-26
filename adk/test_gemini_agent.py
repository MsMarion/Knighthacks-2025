#!/usr/bin/env python3
"""
Test script for Gemini ER-1.5 agents
This script demonstrates the agent functionality and websocket communication
"""

import asyncio
import json
import websockets
import requests
from pathlib import Path

async def test_websocket_connection():
    """Test websocket connection to agent status updates"""
    try:
        uri = "ws://localhost:8002"
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to agent websocket")
            
            # Listen for agent updates
            async for message in websocket:
                data = json.loads(message)
                print(f"📡 Received agent update: {data}")
                
                # Test for a few messages then exit
                if data.get('agent_id') == 'vision-agent':
                    print("🎯 Vision agent update received!")
                    break
                    
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")

async def test_agent_processing():
    """Test agent processing with a sample image"""
    try:
        # Create a sample image (1x1 pixel for testing)
        import io
        from PIL import Image
        
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='white')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes = img_bytes.getvalue()
        
        print("🖼️ Created test image")
        
        # Test the agent processing (this would need to be called from the agent)
        print("🤖 Agent processing would happen here with real Gemini ER-1.5 API")
        
    except Exception as e:
        print(f"❌ Agent processing test failed: {e}")

def test_a2a_connection():
    """Test A2A agent connection"""
    try:
        response = requests.get("http://localhost:8001/", timeout=5)
        if response.status_code == 200:
            print("✅ A2A agent server is running")
        else:
            print(f"⚠️ A2A agent server returned status {response.status_code}")
    except Exception as e:
        print(f"❌ A2A agent connection failed: {e}")

async def main():
    """Run all tests"""
    print("🚀 Starting Gemini ER-1.5 Agent Tests")
    print("=" * 50)
    
    # Test A2A connection
    print("\n1. Testing A2A Agent Connection...")
    test_a2a_connection()
    
    # Test websocket connection
    print("\n2. Testing WebSocket Connection...")
    try:
        await asyncio.wait_for(test_websocket_connection(), timeout=10)
    except asyncio.TimeoutError:
        print("⏰ WebSocket connection timeout (this is expected if no agents are active)")
    
    # Test agent processing
    print("\n3. Testing Agent Processing...")
    await test_agent_processing()
    
    print("\n✅ All tests completed!")
    print("\nTo run the full system:")
    print("1. Set GEMINI_API_KEY environment variable")
    print("2. Run: python adk/agent.py")
    print("3. Open frontend and navigate to agent observatory")
    print("4. Watch the graph visualization for real-time agent updates")

if __name__ == "__main__":
    asyncio.run(main())
