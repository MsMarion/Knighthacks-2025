from google.adk.agents.llm_agent import Agent
from google.adk.a2a.utils.agent_to_a2a import to_a2a
from pathlib import Path
from requests import Request
import asyncio
import websockets
import json
import os
from google import genai
from google.genai import types

MODEL = "gemini-2.5-flash"

PROMPT = """
You are a motion planning agent for a 6-DOF hobby robot arm. OUTPUT: EXACTLY one JSON object with top-level key 'plan'. Nothing before '{', nothing after final '}'. No markdown, no backticks, no explanations. Reasoning level: high.\n
Allowed tools: speak, wait, move_joint, move_joints, relative_move, open_gripper, close_gripper, wave, tap_morse, dance, draw_shape, trajectory, reference_motion.\n
Reference motions: yes, no, dance, dunno, big_wave. For subjective preference or comparison questions (better/favorite/prefer, or 'A or B') CHOOSE ONE of the provided options and answer with tap_morse {text:'<chosen_option>'}. Use dunno only when user explicitly expresses uncertainty or there is no actionable answer. Use yes/no only for explicit yes/no questions. For arithmetic or numeric answers produce tap_morse with the result string.\n
If the user asks about identity, status, or perception (e.g., 'are you a human?', 'can you hear me?', 'are you listening?'), respond non-verbally using reference_motion yes/no, or tap_morse for short words; do not output prose.\n
Guidelines: Combine multiple requested actions as sequential objects in plan list. Use wait for brief pauses (0.2-0.5). Use trajectory for multi-step relative_move sequences. Prefer reference_motion when a named gesture exists. Avoid redundant homing (controller handles). 'Stop' => empty plan.\n
Example formats ONLY (do NOT copy text outside JSON):\n
"""

# follower = SO101FollowerConfig(port="/dev/ttyACM1", id="my_awesome_leader_arm", calibration_dir=Path("/home/samuel/Documents/code/python/adk_1/calibration"))
# follower = SO101Follower(follower)

# config2 = SO101LeaderConfig(port="/dev/ttyACM0", id="my_awesome_leader_arm", calibration_dir=Path("/home/samuel/Documents/code/python/adk_1/calibration"))
# leader2 = SO101Leader(config2)

# leader_kinematics_solver = RobotKinematics(
#     urdf_path="/home/samuel/Documents/code/python/adk_1/SO101/so101_new_calib.urdf",
#     target_frame_name="gripper_frame_link",
#     joint_names=list(follower.bus.motors.keys()),
# )

# try:
#   leader2.connect()
#   follower.connect()
#   follower.bus.enable_torque("elbow_flex")
# except:
#   print("Connection issues")
  
def send_move_request_full(id: int, rx: float, ry:  float, rz: float, x: float, y: float, z: float, open: bool):
  r = Request("POST", "localhost", params="robot_id="+str(id), json={"rx": rx, "ry": ry, "rz": rz, "x": x, "y": y, "z": z, "open": open})

def send_move_request(id: int, x: float, y: float, z: float, open: bool):
  r = Request("POST", "localhost", params="robot_id="+str(id), json={"x": x, "y": y, "z": z, "open": open})

def move_init():
  r = Request("POST", "http://10.21.242.203/move/init")

def set_grabber(s: bool):
  """This is the set_grabber function you can pass it a boolean true for open false for close.

  Args:
      s (bool): true is open false for close.
  """
  r = Request("POST", "http://10.32.242.203/move/absolute", params="robot_id=1", json={"open":s})
  print(r)
  
# Initialize Gemini ER-1.5 client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-api-key-here")
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# WebSocket connections for real-time agent status
websocket_connections = set()

class GeminiERAgent:
    def __init__(self, name: str, description: str, instruction: str):
        self.name = name
        self.description = description
        self.instruction = instruction
        self.status = "idle"
        self.current_thought = None
        self.thinking_budget = 0.5
        
    async def process_with_thinking(self, image_bytes: bytes, prompt: str):
        """Process with Gemini ER-1.5 and expose thinking status via websocket"""
        self.status = "thinking"
        await self.broadcast_status()
        
        try:
            # Configure thinking budget for robotics tasks
            config = types.GenerateContentConfig(
                temperature=0.5,
                thinking_config=types.ThinkingConfig(thinking_budget=self.thinking_budget)
            )
            
            # Send thinking status
            self.current_thought = "Analyzing visual input and planning robotic actions..."
            await self.broadcast_status()
            
            # Generate content with Gemini ER-1.5
            response = gemini_client.models.generate_content(
                model="gemini-robotics-er-1.5-preview",
                contents=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type='image/jpeg',
                    ),
                    prompt
                ],
                config=config
            )
            
            self.status = "processing"
            self.current_thought = "Executing robotic plan..."
            await self.broadcast_status()
            
            # Simulate processing time
            await asyncio.sleep(1)
            
            self.status = "idle"
            self.current_thought = None
            await self.broadcast_status()
            
            return response.text
            
        except Exception as e:
            self.status = "error"
            self.current_thought = f"Error: {str(e)}"
            await self.broadcast_status()
            raise e
    
    async def broadcast_status(self):
        """Broadcast agent status to all connected websockets"""
        status_data = {
            "agent_id": self.name,
            "status": self.status,
            "current_thought": self.current_thought,
            "timestamp": asyncio.get_event_loop().time()
        }
        
        if websocket_connections:
            message = json.dumps(status_data)
            disconnected = set()
            for websocket in websocket_connections:
                try:
                    await websocket.send(message)
                except websockets.exceptions.ConnectionClosed:
                    disconnected.add(websocket)
            
            # Remove disconnected websockets
            websocket_connections -= disconnected

# Create Gemini ER-1.5 agents
vision_agent = GeminiERAgent(
    name="vision_agent",
    description="Computer Vision and Object Detection",
    instruction="You are a computer vision agent specialized in object detection, spatial reasoning, and robotic perception tasks."
)

motion_agent = GeminiERAgent(
    name="motion_agent", 
    description="Motion Planning and Trajectory Generation",
    instruction="You are a motion planning agent that generates trajectories and plans robotic movements based on visual input."
)

coordination_agent = GeminiERAgent(
    name="coordination_agent",
    description="Task Coordination and Orchestration", 
    instruction="You are a coordination agent that orchestrates complex multi-step robotic tasks and manages agent communication."
)

# WebSocket server for real-time agent status
async def websocket_handler(websocket, path):
    """Handle websocket connections for agent status updates"""
    websocket_connections.add(websocket)
    try:
        # Send initial status of all agents
        agents = [vision_agent, motion_agent, coordination_agent]
        for agent in agents:
            status_data = {
                "agent_id": agent.name,
                "status": agent.status,
                "current_thought": agent.current_thought,
                "timestamp": asyncio.get_event_loop().time()
            }
            await websocket.send(json.dumps(status_data))
        
        # Keep connection alive
        await websocket.wait_closed()
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        websocket_connections.discard(websocket)

def start_websocket_server():
    """Start the websocket server for agent status updates"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    start_server = websockets.serve(websocket_handler, "localhost", 8002)
    loop.run_until_complete(start_server)
    print("WebSocket server started on ws://localhost:8002")
    loop.run_forever()

# Original root agent
root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description="Glados portal",
    instruction="You are glados from portal and you will be playing chess with a player. You also control a robotic arm with six joints. you can open and close a grabber with set_grabber by passing true for open and false for close. Before calling any tools you need to execute move_init once.",
    tools=[set_grabber, move_init],
)

a2a_app = to_a2a(root_agent, port=8001)

# Start websocket server in background
import threading
websocket_thread = threading.Thread(target=start_websocket_server, daemon=True)
websocket_thread.start()
