# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import time

from json import dump
from pathlib import Path

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
from lerobot.robots.so101_follower.so101_follower import SO101Follower
from lerobot.robots.so101_follower.config_so101_follower import SO101FollowerConfig
from lerobot.teleoperators.so101_leader.config_so101_leader import SO101LeaderConfig
from lerobot.teleoperators.so101_leader.so101_leader import SO101Leader
from lerobot.utils.robot_utils import busy_wait
from lerobot.utils.visualization_utils import init_rerun, log_rerun_data

FPS = 30

# Initialize the robot and teleoperator config
# follower_config = SO100FollowerConfig(
#     port="/dev/ttyACM1", id="my_awesome_follower_arm", use_degrees=True
# )
config = SO101FollowerConfig(port="/dev/ttyACM1", id="my_awesome_leader_arm", calibration_dir=Path("/home/samuel/Documents/code/python/adk_1/calibration"))

# Initialize the robot and teleoperator
# follower = SO100Follower(follower_config)
leader = SO101Follower(config)

# NOTE: It is highly recommended to use the urdf in the SO-ARM100 repo: https://github.com/TheRobotStudio/SO-ARM100/blob/main/Simulation/SO101/so101_new_calib.urdf
# follower_kinematics_solver = RobotKinematics(
#     urdf_path="/home/samuel/Documents/code/python/adk_1/SO101/so101_new_calib.urdf",
#     target_frame_name="gripper_frame_link",
#     joint_names=list(follower.bus.motors.keys()),
# )

config2 = SO101LeaderConfig(port="/dev/ttyACM0", id="my_awesome_leader_arm", calibration_dir=Path("/home/samuel/Documents/code/python/adk_1/calibration"))

# Initialize the robot and teleoperator
# follower = SO100Follower(follower_config)
leader2 = SO101Leader(config)


# NOTE: It is highly recommended to use the urdf in the SO-ARM100 repo: https://github.com/TheRobotStudio/SO-ARM100/blob/main/Simulation/SO101/so101_new_calib.urdf
leader_kinematics_solver = RobotKinematics(
    urdf_path="/home/samuel/Documents/code/python/adk_1/SO101/so101_new_calib.urdf",
    target_frame_name="gripper_frame_link",
    joint_names=list(leader.bus.motors.keys()),
)

# Build pipeline to convert teleop joints to EE action
leader_to_ee = RobotProcessorPipeline[RobotAction, RobotAction](
    steps=[
        ForwardKinematicsJointsToEE(
            kinematics=leader_kinematics_solver, motor_names=list(leader.bus.motors.keys())
        ),
    ],
    to_transition=robot_action_to_transition,
    to_output=transition_to_robot_action,
)

# build pipeline to convert EE action to robot joints
ee_to_follower_joints = RobotProcessorPipeline[tuple[RobotAction, RobotObservation], RobotAction](
    [
        EEBoundsAndSafety(
            end_effector_bounds={"min": [-1.0, -1.0, -1.0], "max": [1.0, 1.0, 1.0]},
            max_ee_step_m=0.10,
        ),
        InverseKinematicsEEToJoints(
            kinematics=leader_kinematics_solver,
            motor_names=list(leader.bus.motors.keys()),
            initial_guess_current_joints=False,
        ),
    ],
    to_transition=robot_action_observation_to_transition,
    to_output=transition_to_robot_action,
)


# def send_motion_to_arm(shoulder_pan: float, shoulder_lift: float, elbow_flex: float, wrist_flex: float, wrist_roll: float, gripper: float):
#   """
#   This method instructs the robotic arm to move the each of the arm segments like shoulder_pan, shoulder_lift, elbow_flex, wrist_flex, wrist_roll, gripper. The allowed range of input is [0-100]
#   Keep all joints at zero unless instructed otherwise.

#   Args:
#       shoulder_pan (float): shoulder_pan joint
#       shoulder_lift (float): shoulder_lift joint
#       elbow_flex (float): elbow_flex joint
#       wrist_flex (float): wrist_flex joint
#       wrist_roll (float): wrist_roll joint
#       gripper (float): gripper joint
#   """
  
#   n1: dict[str, float] = {'shoulder_pan.pos': shoulder_pan, 'shoulder_lift.pos': shoulder_lift, 'elbow_flex.pos': elbow_flex, 'wrist_flex.pos': wrist_flex, 'wrist_roll.pos': wrist_roll, 'gripper.pos': gripper}
#   follower.send_action(n1)


# Connect to the robot and teleoperator
try:
  leader2.connect()
  leader.connect()
except:
  print("Connection issues")

print(leader_to_ee)
print(ee_to_follower_joints.to_transition)

leader_kinematics_solver.forward_kinematics()

n1: dict[str, float] = {'shoulder_pan.pos': 50, 'shoulder_lift.pos': 0, 'elbow_flex.pos': 0, 'wrist_flex.pos': 0, 'wrist_roll.pos': 0, 'gripper.pos': 0}

# leader.send_action(n1)

# print("Starting teleop loop...")
# while True:
#     t0 = time.perf_counter()

#     # Get robot observation
#     robot_obs = leader.get_observation()

#     # print(robot_obs)

#     # Get teleop observation
#     leader_joints_obs = leader2.get_action()

#     # teleop joints -> teleop EE action
#     leader_ee_act = leader_to_ee(leader_joints_obs)

#     # teleop EE -> robot joints
#     follower_joints_act = ee_to_follower_joints((leader_ee_act, robot_obs))

#     print(follower_joints_act)

# # Send action to robot
# #     _ = leader.send_action(follower_joints_act)
# # # n1: dict[str, float] = {'shoulder_pan': 247, 'shoulder_lift': 489, 'elbow_flex': 1334, 'wrist_flex':252, 'wrist_roll': 2045, 'gripper': 1359}
# # # leader.send_action(n1)

#     # Visualize
#     log_rerun_data(observation=leader_ee_act, action=follower_joints_act)

#     busy_wait(max(1.0 / FPS - (time.perf_counter() - t0), 0.0))
