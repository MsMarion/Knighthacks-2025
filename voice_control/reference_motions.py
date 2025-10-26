from __future__ import annotations
from pathlib import Path
from typing import Dict, Any
import json

DEFAULT_REF_PATH = Path("voice_control/references.json")


def load_references(path: Path | str = DEFAULT_REF_PATH) -> Dict[str, Any]:
    p = Path(path)
    if not p.exists():
        return {"home_pose": {}, "motions": {}, "allowed_ranges": {}}
    with open(p, "r") as f:
        return json.load(f)


def save_references(data: Dict[str, Any], path: Path | str = DEFAULT_REF_PATH) -> None:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w") as f:
        json.dump(data, f, indent=2)


def get_motion(name: str, refs: Dict[str, Any]) -> list[dict]:
    return (refs.get("motions") or {}).get(name, [])