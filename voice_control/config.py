import os
from pathlib import Path
try:
    from pydantic import BaseModel
except Exception:
    # Minimal fallback so demo runs without pydantic installed
    class BaseModel:  # type: ignore
        pass


class SerialConfig(BaseModel):
    port: str = "COM15"  # Default to COM15 per user setup; can be overridden via env or CLI
    baudrate: int = 1000000


class ModelConfig(BaseModel):
    # If set, we load from local dir; else use HF Hub id
    model_id: str = "openai/gpt-oss-20b"
    model_local_dir: str | None = r"models/gpt-oss-20b"  # project-local cache
    # Optional comma-separated fallbacks (smaller) via env LEROBOT_MODEL_FALLBACKS
    fallback_model_ids: list[str] = [
        "openai/gpt-oss-7b",
        "openai/gpt-oss-2b",
    ]
    max_new_tokens: int = 48
    reasoning_level: str = "low"  # low | medium | high (used in system prompt)
    # Use explicit cpu device map to avoid accelerate offload mismatch with fused MoE quant weights
    device_map: str = "cpu"
    timeout_s: int = 30  # base; may be overridden by env or scaled for very large models
    prefer_heuristic_on_cpu: bool = True


class AudioConfig(BaseModel):
    sample_rate: int = 16000
    mic_device: int | None = None  # None = default input device
    vad_silence_ms: int = 800  # end-of-utterance silence window
    max_utterance_s: int = 15
    vosk_model_path: str | None = None  # e.g., r"c:/models/vosk-model-small-en-us-0.15"
    prefer_whisper: bool = True
    # Minimum utterance gating to reduce premature short returns
    min_words: int = 2
    min_chars: int = 6


class SafetyConfig(BaseModel):
    # Extra soft limits and behavior constraints
    max_speed_mode: str = "slow"  # very_slow | slow | medium | fast
    enable_clipping: bool = True


class Paths(BaseModel):
    calibration_file: Path = Path("voice_control/table_calibration.json")
    logs_dir: Path = Path("voice_control/logs")


serial = SerialConfig()
# Allow environment variable override (e.g., set LEROBOT_PORT=COM15)
serial.port = os.getenv("LEROBOT_PORT", serial.port)
model = ModelConfig()
# Allow environment overrides for model selection
import os as _os
_mid = _os.getenv("LEROBOT_MODEL_ID")
if _mid:
    model.model_id = _mid
_mdir = _os.getenv("LEROBOT_MODEL_DIR")
if _mdir:
    model.model_local_dir = _mdir
_fbs = _os.getenv("LEROBOT_MODEL_FALLBACKS")
if _fbs:
    model.fallback_model_ids = [x.strip() for x in _fbs.split(",") if x.strip()]
# Timeout override
_tov = _os.getenv("LEROBOT_TIMEOUT_S")
if _tov:
    try:
        model.timeout_s = max(5, int(_tov))
    except Exception:
        pass
audio = AudioConfig()
safety = SafetyConfig()
paths = Paths()