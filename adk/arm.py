from lerobot.robots.so100_follower.so100_follower import SO100Follower
from lerobot.model.kinematics import RobotKinematics
from lerobot.processor import RobotAction, RobotObservation, RobotProcessorPipeline
from lerobot.processor.converters import (
    robot_action_observation_to_transition,
    robot_action_to_transition,
    transition_to_robot_action,
)
from lerobot.robots.so100_follower.config_so100_follower import SO100FollowerConfig
from lerobot.robots.so100_follower.robot_kinematic_processor import (
    EEBoundsAndSafety,
    ForwardKinematicsJointsToEE,
    InverseKinematicsEEToJoints,
)
from lerobot.robots.so100_follower.so100_follower import SO100Follower
from numpy import ndarray

follower_config = SO100FollowerConfig(
    port="/dev/tty.usbmodem5A460814411", id="my_awesome_follower_arm", use_degrees=True
)
follower = SO100Follower(follower_config)

follower_kinematics_solver = RobotKinematics(
    urdf_path="/home/samuel/Documents/code/python/adk_1/SO101/so101_new_calib.urdf",
    target_frame_name="gripper_frame_link",
    joint_names=list(follower.bus.motors.keys()),
)


leader_to_ee = RobotProcessorPipeline[RobotAction, RobotAction](
    steps=[
        ForwardKinematicsJointsToEE(
            kinematics=follower_kinematics_solver, motor_names=list(follower.bus.motors.keys())
        ),
    ],
    to_transition=robot_action_to_transition,
    to_output=transition_to_robot_action,
)

print(list(follower.bus.motors.keys()))

# ee_to_follower_joints = RobotProcessorPipeline[tuple[RobotAction, RobotObservation], RobotAction](
#     [
#         EEBoundsAndSafety(
#             end_effector_bounds={"min": [-1.0, -1.0, -1.0], "max": [1.0, 1.0, 1.0]},
#             max_ee_step_m=0.10,
#         ),
#         InverseKinematicsEEToJoints(
#             kinematics=follower_kinematics_solver,
#             motor_names=list(follower.bus.motors.keys()),
#             initial_guess_current_joints=False,
#         ),
#     ],
#     to_transition=robot_action_observation_to_transition,
#     to_output=transition_to_robot_action,
# )

def send_motion_to_arm(x: float, y: float, z: float, r: float):
  """This method instructs the robotic arm to move the (x,y,z) axis.

  Args:
      x (float): x axis
      y (float): y axis
      z (float): z axis
      r (float): wrist rotation
  """
  
  # ['shoulder_pan', 'shoulder_lift', 'elbow_flex', 'wrist_flex', 'wrist_roll', 'gripper']
  ob = follower.get_observation()
  n1: dict[str, float] = {'shoulder_pan': 0, 'shoulder_lift': 0, 'elbow_flex': 0, 'wrist_flex': 0, 'wrist_roll': 0, 'gripper': 0}
  
  x = follower_kinematics_solver.inverse_kinematics(ob, n1)
  follower.send_feedback(x)

  

print(dir(follower))
print(dir(follower.bus))
send_motion_to_arm(1,1,1,1)