from __future__ import annotations
import time, os
from typing import Any, Dict, List

from .agent_robot import AgentRobot
from .tts import tts_say
from .reference_motions import load_references, get_motion
from .limits import load_calibration

VERBOSE = bool(os.getenv("LEROBOT_VERBOSE"))


def execute_plan(plan: List[Dict[str, Any]], robot: AgentRobot) -> None:
    did_motion = False
    for idx, step in enumerate(plan or []):
        name = (step.get("call") or step.get("action") or "").lower()
        args = step.get("args") or {}
        if VERBOSE:
            print(f"[EXEC] Step {idx}: {name} {args}")
        if name == "speak":
            msg = str(args.get("text", ""))
            if msg:
                tts_say(msg)
        elif name == "wave":
            robot.wave(int(args.get("repetitions", 1)))
            did_motion = True
        elif name == "tap_morse":
            robot.tap_morse(str(args.get("text", "sos")), int(args.get("unit_ms", 150)))
        elif name == "dance":
            refs = load_references()
            steps = get_motion("dance", refs)
            if steps:
                for st in steps:
                    vals = st.get("positions", {})
                    try:
                        robot.move_joints({k: int(v) for k, v in vals.items()})
                    except Exception:
                        robot.move_joints(dict(vals))
                    try:
                        dur = float(st.get("duration", 0.0))
                        if dur > 0:
                            time.sleep(min(dur, 5.0))
                    except Exception:
                        time.sleep(0.4)
            else:
                robot.dance(str(args.get("style", "small")), int(args.get("duration_s", 6)))
            did_motion = True
        elif name == "draw_shape":
            robot.draw_shape(str(args.get("shape", "circle")), int(args.get("size_mm", 60)))
            did_motion = True
        elif name == "wait":
            dur = max(0.0, float(args.get("seconds", 0.5)))
            time.sleep(min(dur, 10.0))
        elif name == "move_joint":
            robot.move_joint(str(args.get("name", "")), int(args.get("position", 2048)))
            did_motion = True
        elif name == "move_joints":
            robot.move_joints(dict(args.get("values", {})))
            did_motion = True
        elif name == "relative_move":
            robot.relative_move(dict(args.get("deltas", {})))
            did_motion = True
        elif name == "open_gripper":
            robot.open_gripper()
            did_motion = True
        elif name == "close_gripper":
            robot.close_gripper()
            did_motion = True
        elif name == "trajectory":
            steps = args.get("steps", []) or []
            for j, st in enumerate(steps):
                if VERBOSE:
                    print(f"[EXEC]  trajectory step {j}: {st}")
                if "wait" in st:
                    try:
                        time.sleep(max(0.0, float(st.get("wait", 0.1))))
                    except Exception:
                        time.sleep(0.1)
                    continue
                if "move_joints" in st:
                    robot.move_joints(dict(st.get("move_joints", {})))
                    continue
                if "relative_move" in st:
                    robot.relative_move(dict(st.get("relative_move", {})))
                    continue
            did_motion = True
        elif name == "reference_motion":
            refs = load_references()
            motion_name = str(args.get("name", "")).lower().strip()
            steps = get_motion(motion_name, refs)
            if not steps:
                print(f"[WARN] Unknown reference motion: {motion_name}")
                continue
            calib = load_calibration()
            home_pre = calib.get("home_pose") or refs.get("home_pose") or {}
            if home_pre:
                try:
                    robot.move_joints({k: int(v) for k, v in home_pre.items()})
                    time.sleep(0.6)
                except Exception:
                    pass
            for st in steps:
                vals = st.get("positions", {})
                try:
                    robot.move_joints({k: int(v) for k, v in vals.items()})
                except Exception:
                    robot.move_joints(dict(vals))
                try:
                    dur = float(st.get("duration", 0.0))
                    if dur > 0:
                        time.sleep(min(dur, 5.0))
                except Exception:
                    time.sleep(0.4)
            home_post = load_calibration().get("home_pose") or refs.get("home_pose") or {}
            if home_post:
                robot.move_joints({k: int(v) for k, v in home_post.items()})
                time.sleep(0.8)
            did_motion = True
        else:
            print(f"[WARN] Unknown call: {name} {args}")
    # Auto-return to home after any physical motion sequence (except pure tap_morse which already lifts)
    if did_motion:
        try:
            robot.go_home()
        except Exception:
            pass