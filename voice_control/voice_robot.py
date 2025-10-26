from __future__ import annotations
import sys
import time
from typing import Any, Dict

from voice_control.stt import STT
from voice_control.tts import tts_say
from voice_control.llm_tools_agent_simple import SimpleToolsPlanner
from voice_control.agent_executor import execute_plan
from voice_control.agent_robot import AgentRobot


def _normalize_for_llm(s: str) -> str:
    t = (s or "").strip()
    if not t:
        return t
    low = t.lower()
    # Fix common STT mishear: "our" -> "are" at sentence start
    if low.startswith("our "):
        t = "are " + t[4:]
        low = t.lower()
    # Add trailing '?' for yes/no forms lacking punctuation, but avoid imperatives
    yn_starts = ("is ", "are ", "do ", "does ", "can ", "will ", "would ", "should ")
    action_keywords = ("wave", "open", "close", "draw", "tap", "karate", "punch", "move")
    if any(low.startswith(p) for p in yn_starts) and not any(k in low for k in action_keywords) and not low.endswith("?"):
        t = t + "?"
    return t


def main():
    print("Voice robot starting. Say a command, or 'stop' to exit.")
    stt = STT()
    # Fresh simple LLM planner (no heuristic hardcoding)
    llm = SimpleToolsPlanner()
    robot = AgentRobot()

    robot.connect()
    robot.go_home()

    try:
        while True:
            # tts_say("I'm listening.")
            print("Listening...")
            text = stt.listen_once()
            if not text:
                continue
            norm = _normalize_for_llm(text)
            if norm != text:
                print(f"Heard: {text}")
                print(f"Using: {norm}")
            else:
                print(f"Heard: {text}")
            if text.strip().lower() in {"quit", "exit", "stop"}:
                tts_say("Stopping.")
                break

            # New tools-based planning
            plan = llm.plan(norm)
            print("Plan:", plan)
            execute_plan(plan, robot)

            time.sleep(0.5)
    finally:
        robot.disconnect()


if __name__ == "__main__":
    main()