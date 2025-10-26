import json
from lerobot.teleoperators.so101_leader import SO101LeaderConfig, SO101Leader

config = SO101LeaderConfig(
  port="/dev/ttyACM0",
  id="my_awesome_leader"
)

leader = SO101Leader(config)
leader.setup_motors()

with open("so101_leader_config.json", "w") as f:
  json.dump(config.__dict__, f, indent=4)