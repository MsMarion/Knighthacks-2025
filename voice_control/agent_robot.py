from __future__ import annotations
from typing import Any, Dict
from .robot_controller import RobotController as _Base
from .limits import load_joint_limits, load_calibration


class AgentRobot:
    """Thin facade to allow agent-specific helpers without touching base controller."""

    def __init__(self) -> None:
        self._rc = _Base()
        self._limits = load_joint_limits()
        self._calib = load_calibration()

    def connect(self):
        self._rc.connect()
        if self._rc.simulation:
            print("[AgentRobot] WARNING: Running in simulation (no physical movement). Check hardware connection / port.")

    def go_home(self):
        self._rc.go_home()

    def wave(self, repetitions: int = 1):
        self._rc.wave(repetitions)

    def tap_morse(self, text: str, unit_ms: int = 150):
        self._rc.tap_morse(text, unit_ms)

    def dance(self, style: str = "small", duration_s: int = 6):
        self._rc.dance(style, duration_s)

    def draw_shape(self, shape: str, size_mm: int = 60):
        self._rc.draw_shape(shape, size_mm)

    def move_joint(self, name: str, position: int):
        p = int(position)
        if name in self._limits:
            mn, mx = self._limits[name]
            p = max(mn, min(mx, p))
        if self._rc.motor_bus:
            self._rc.motor_bus.write("Goal_Position", p, name)
        else:
            print(f"[SIM] move_joint {name} -> {p}")

    def move_joints(self, values: Dict[str, int]):
        for j, p in values.items():
            self.move_joint(j, int(p))

    def relative_move(self, deltas: Dict[str, int]):
        # naive relative motion around nominal 2048
        for j, d in deltas.items():
            base = int(self._calib.get("home_pose", {}).get(j, 2048))
            self.move_joint(j, base + int(d))

    def open_gripper(self):
        self.move_joint("gripper", 2400)

    def close_gripper(self):
        self.move_joint("gripper", 1600)

    def disconnect(self):
        self._rc.disconnect()

    def status(self) -> dict:
        return {
            'simulation': self._rc.simulation,
            'connected': bool(self._rc.motor_bus),
            'home_pose': (self._calib or {}).get('home_pose')
        }