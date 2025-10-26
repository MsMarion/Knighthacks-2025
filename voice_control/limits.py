from __future__ import annotations
import json
from pathlib import Path
from typing import Dict, Tuple

from .config import paths


def load_calibration() -> Dict:
    p = Path(paths.calibration_file)
    if p.exists():
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            pass
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
    }


def load_joint_limits() -> Dict[str, Tuple[int, int]]:
    # Try repository-level robot limits if present
    for name in ("robot_actual_limits.json", "motor_limits_backup.json"):
        rp = Path(name)
        if rp.exists():
            try:
                data = json.loads(rp.read_text(encoding="utf-8"))
                # Expected format: {joint: {min: int, max: int}} or similar
                out: Dict[str, Tuple[int, int]] = {}
                for k, v in data.items():
                    if isinstance(v, dict):
                        mn = int(v.get("min", 0))
                        mx = int(v.get("max", 4095))
                        out[k] = (mn, mx)
                if out:
                    return out
            except Exception:
                pass
    # fallback: nominal full range
    return {
        "shoulder_pan": (0, 4095),
        "shoulder_lift": (0, 4095),
        "elbow_flex": (0, 4095),
        "wrist_flex": (0, 4095),
        "wrist_roll": (0, 4095),
        "gripper": (0, 4095),
    }


def save_calibration(data: Dict) -> None:
    """Persist calibration data to paths.calibration_file."""
    p = Path(paths.calibration_file)
    p.parent.mkdir(parents=True, exist_ok=True)
    try:
        p.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception:
        # Best-effort; caller may handle errors
        pass