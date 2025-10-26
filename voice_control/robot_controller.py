from __future__ import annotations
import time, os
from pathlib import Path
from typing import Dict, List, Tuple
import json

from typing import Any

from .config import serial, safety, paths
from .morse import to_morse


MOTORS = {
    "shoulder_pan": [1, "sts3215"],
    "shoulder_lift": [2, "sts3215"],
    "elbow_flex": [3, "sts3215"],
    "wrist_flex": [4, "sts3215"],
    "wrist_roll": [5, "sts3215"],
    "gripper": [6, "sts3215"],
}


VERBOSE = bool(os.getenv("LEROBOT_VERBOSE"))


class RobotController:
    def __init__(self) -> None:
        self.motor_bus = None  # type: ignore[assignment]
        self.simulation = False
        self.calib = self._load_calibration(paths.calibration_file)

    # --- Basic pose helpers -------------------------------------------------
    def rest_pose(self) -> dict:
        """Return the configured home/rest pose dictionary."""
        return (self.calib.get("home_pose") if isinstance(self.calib, dict) else None) or {
            "shoulder_pan": 2048,
            "shoulder_lift": 2048,
            "elbow_flex": 2048,
            "wrist_flex": 2048,
            "wrist_roll": 2048,
            "gripper": 2048,
        }

    def _load_calibration(self, path: Path) -> dict:
        if path.exists():
            with open(path, "r") as f:
                return json.load(f)
        # defaults
        return {
            "home_pose": {
                "shoulder_pan": 2048,
                "shoulder_lift": 2048,
                "elbow_flex": 2048,
                "wrist_flex": 2048,
                "wrist_roll": 2048,
                "gripper": 2048,
            },
            "table_z_mm": 100,
            "safe_polygon": [[-100, -100], [100, -100], [100, 100], [-100, 100]],
            "tap_depth_mm": 2,
            "tap_torque": 180,
            "max_speed": safety.max_speed_mode,
        }

    def connect(self):
        if self.motor_bus or self.simulation:
            return
        try:
            # Lazy import hardware drivers; if unavailable, fall back to SIM
            from lerobot.common.robot_devices.motors.feetech import FeetechMotorsBus, TorqueMode
            from lerobot.common.robot_devices.motors.configs import FeetechMotorsBusConfig

            cfg = FeetechMotorsBusConfig(port=serial.port, motors=MOTORS)
            self.motor_bus = FeetechMotorsBus(cfg)
            self.motor_bus.connect()
            self.motor_bus.write("Torque_Enable", TorqueMode.ENABLED.value)
        except Exception as e:
            print(f"[RobotController] Hardware connect failed ({e}); running in SIMULATION mode.")
            self.simulation = True
            self.motor_bus = None
            return
        # Set safe speed
        accel_map = {
            "very_slow": 50,
            "slow": 100,
            "medium": 150,
            "fast": 254,
        }
        acc = accel_map.get(safety.max_speed_mode, 100)
        if self.motor_bus:
            for name in MOTORS.keys():
                self.motor_bus.write("Mode", 0, name)
                self.motor_bus.write("P_Coefficient", 16, name)
                self.motor_bus.write("I_Coefficient", 0, name)
                self.motor_bus.write("D_Coefficient", 32, name)
                self.motor_bus.write("Maximum_Acceleration", acc, name)
                self.motor_bus.write("Acceleration", acc, name)
        if VERBOSE:
            print(f"[ROBOT] Connected. Simulation={self.simulation} Port={serial.port} BusReady={bool(self.motor_bus)}")

    def disconnect(self):
        if not self.motor_bus:
            self.simulation = False
            return
        try:
            try:
                from lerobot.common.robot_devices.motors.feetech import TorqueMode
                torque_disable = TorqueMode.DISABLED.value
            except Exception:
                torque_disable = 0
            self.motor_bus.write("Torque_Enable", torque_disable)
        finally:
            try:
                self.motor_bus.disconnect()
            finally:
                self.motor_bus = None
                self.simulation = False

    def go_home(self):
        self._ensure()
        if self.simulation:
            if VERBOSE:
                print("[SIM] go_home")
        else:
            for name, pos in self.rest_pose().items():
                if VERBOSE:
                    print(f"[WRITE] {name} -> {int(pos)} (home)")
                self.motor_bus.write("Goal_Position", int(pos), name)
        time.sleep(1.2)

    def home(self):  # alias
        self.go_home()

    def wave(self, repetitions: int = 1):
        """Wave the wrist from a known rest pose and return to rest afterwards.

        Ensures a consistent starting orientation so repeated calls don't drift.
        """
        self._ensure()
        # Stage at rest/home first
        self.go_home()
        # Simple wave using wrist_roll
        for _ in range(repetitions):
            for roll in (1600, 2400, 1600, 2048):
                if self.simulation and VERBOSE:
                    print(f"[SIM] wrist_roll -> {roll}")
                else:
                    if VERBOSE:
                        print(f"[WRITE] wrist_roll -> {roll} (wave)")
                    self.motor_bus.write("Goal_Position", roll, "wrist_roll")
                time.sleep(0.35)
        # Return to rest pose explicitly (in case other joints changed in future variants)
        self.go_home()

    def dance(self, style: str = "small", duration_s: int = 6):
        self._ensure()
        self.go_home()
        end_time = time.time() + duration_s
        step = 150 if style == "small" else 300
        i = 0
        while time.time() < end_time:
            # sway shoulder and elbow
            if self.simulation and VERBOSE:
                print(f"[SIM] shoulder_pan -> {2048 + (-1) ** i * step}")
                print(f"[SIM] elbow_flex -> {2048 + (1) ** i * step}")
                print(f"[SIM] wrist_flex -> {2048 + (-1) ** (i + 1) * step}")
            else:
                self.motor_bus.write("Goal_Position", 2048 + (-1) ** i * step, "shoulder_pan")
                self.motor_bus.write("Goal_Position", 2048 + (1) ** i * step, "elbow_flex")
                self.motor_bus.write("Goal_Position", 2048 + (-1) ** (i + 1) * step, "wrist_flex")
                if VERBOSE:
                    print(f"[WRITE] dance cycle {i}")
            time.sleep(0.4)
            i += 1

    def draw_shape(self, shape: str, size_mm: int):
        self._ensure()
        self.go_home()
        # Placeholder: without IK we approximate by joint sweeps
        span = max(80, min(400, int(size_mm * 3)))
        if shape == "circle":
            for i in range(12):
                pos = 2048 + int(span * 0.5 * (1 if i % 2 == 0 else -1))
                if self.simulation and VERBOSE:
                    print(f"[SIM] shoulder_pan -> {pos}")
                    print(f"[SIM] elbow_flex -> {2048 - (pos - 2048)}")
                else:
                    self.motor_bus.write("Goal_Position", pos, "shoulder_pan")
                    self.motor_bus.write("Goal_Position", 2048 - (pos - 2048), "elbow_flex")
                    if VERBOSE:
                        print(f"[WRITE] circle pair shoulder_pan={pos}")
                time.sleep(0.25)
        elif shape == "square":
            for _ in range(2):
                for p in (2048 - span, 2048 + span):
                    if self.simulation and VERBOSE:
                        print(f"[SIM] shoulder_pan -> {p}")
                    else:
                        self.motor_bus.write("Goal_Position", p, "shoulder_pan")
                    if VERBOSE:
                        print(f"[WRITE] square shoulder_pan -> {p}")
                    time.sleep(0.25)
                    if self.simulation:
                        print(f"[SIM] elbow_flex -> {2048 + span}")
                    else:
                        self.motor_bus.write("Goal_Position", 2048 + span, "elbow_flex")
                    if VERBOSE:
                        print(f"[WRITE] square elbow_flex -> {2048 + span}")
                    time.sleep(0.25)
        else:
            # triangle
            for p in (2048 - span, 2048 + span, 2048):
                if self.simulation:
                    print(f"[SIM] shoulder_pan -> {p}")
                else:
                    self.motor_bus.write("Goal_Position", p, "shoulder_pan")
                if VERBOSE:
                    print(f"[WRITE] triangle shoulder_pan -> {p}")
                time.sleep(0.35)

    def tap_morse(self, text: str, unit_ms: int = 150):
        self._ensure()
        # Prefer calibrated tap positions
        tap_cfg = (self.calib or {}).get("tap", {})
        down = int(tap_cfg.get("wrist_flex_down", 2048 + 140))
        up = int(tap_cfg.get("wrist_flex_up", 2048))
        safe_lift = tap_cfg.get("safe_lift_pose")  # dict of joint->pos
        # Move to safe lift (or home) before starting
        if safe_lift and isinstance(safe_lift, dict):
            if self.simulation and VERBOSE:
                for j, p in safe_lift.items():
                    print(f"[SIM] {j} -> {int(p)} (safe lift)")
            else:
                for j, p in safe_lift.items():
                    try:
                        self.motor_bus.write("Goal_Position", int(p), j)
                    except Exception:
                        pass
            time.sleep(0.8)
        else:
            self.go_home()
        # A gentle "tap" uses a small wrist_flex motion down/up
        dot = unit_ms / 1000.0
        dash = 3 * dot
        intra = dot
        inter_letter = 3 * dot
        inter_word = 7 * dot

        sequence = to_morse(text)
        for token in sequence:
            if token == " ":
                time.sleep(inter_word)
                continue
            for ch in token:
                # tap down
                if self.simulation and VERBOSE:
                    print(f"[SIM] wrist_flex -> {down} (tap {ch})")
                else:
                    self.motor_bus.write("Goal_Position", down, "wrist_flex")
                if VERBOSE:
                    print(f"[WRITE] tap down wrist_flex={down}")
                time.sleep(dot * 0.6)  # descend quickly
                # short dwell depending on dot/dash
                dwell = dot if ch == "." else dash
                time.sleep(max(0.02, dwell * 0.4))
                # raise up
                if self.simulation and VERBOSE:
                    print(f"[SIM] wrist_flex -> {up}")
                else:
                    self.motor_bus.write("Goal_Position", up, "wrist_flex")
                if VERBOSE:
                    print(f"[WRITE] tap up wrist_flex={up}")
                time.sleep(intra)
            time.sleep(inter_letter)
        # Return to safe lift at end if available
        if safe_lift and isinstance(safe_lift, dict):
            if self.simulation and VERBOSE:
                for j, p in safe_lift.items():
                    print(f"[SIM] {j} -> {int(p)} (safe lift end)")
            else:
                for j, p in safe_lift.items():
                    try:
                        self.motor_bus.write("Goal_Position", int(p), j)
                    except Exception:
                        pass
            time.sleep(0.6)

    def stop(self):
        # No streaming control here; a real-time loop would be needed. Placeholder.
        pass

    def _ensure(self):
        if not self.motor_bus:
            self.connect()
            if self.simulation and VERBOSE:
                print("[ROBOT] Still in simulation after connect attempt.")