import os
from __future__ import annotations
import json, re, time, os, hashlib  # added hashlib for deterministic preference choice
from typing import Any, Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor

from .config import model as model_cfg

# Force UTF-8 mode on Windows to avoid cp1252 'charmap' decode issues when HF reads text files
os.environ.setdefault("PYTHONUTF8", "1")
from .limits import load_calibration, load_joint_limits
from .reference_motions import load_references


SYSTEM_SPEC = (
    "You are a motion planning agent for a 6-DOF hobby robot arm. OUTPUT: EXACTLY one JSON object with top-level key 'plan'. Nothing before '{', nothing after final '}'. No markdown, no backticks, no explanations. Reasoning level: {reasoning_level}.\n"
    "Allowed tools: speak, wait, move_joint, move_joints, relative_move, open_gripper, close_gripper, wave, tap_morse, dance, draw_shape, trajectory, reference_motion.\n"
    "Reference motions: yes, no, dance, dunno, big_wave. For subjective preference or comparison questions (better/favorite/prefer, or 'A or B') CHOOSE ONE of the provided options and answer with tap_morse {text:'<chosen_option>'}. Use dunno only when user explicitly expresses uncertainty or there is no actionable answer. Use yes/no only for explicit yes/no questions. For arithmetic or numeric answers produce tap_morse with the result string.\n"
    "If the user asks about identity, status, or perception (e.g., 'are you a human?', 'can you hear me?', 'are you listening?'), respond non-verbally using reference_motion yes/no, or tap_morse for short words; do not output prose.\n"
    "Guidelines: Combine multiple requested actions as sequential objects in plan list. Use wait for brief pauses (0.2-0.5). Use trajectory for multi-step relative_move sequences. Prefer reference_motion when a named gesture exists. Avoid redundant homing (controller handles). 'Stop' => empty plan.\n"
    "Example formats ONLY (do NOT copy text outside JSON):\n"
    "User: wave at me => {\"plan\":[{\"call\":\"wave\",\"args\":{\"repetitions\":1}}]}\n"
    "User: open the gripper then close it => {\"plan\":[{\"call\":\"open_gripper\",\"args\":{}},{\"call\":\"wait\",\"args\":{\"seconds\":0.4}},{\"call\":\"close_gripper\",\"args\":{}}]}\n"
    "User: is the sky green? => {\"plan\":[{\"call\":\"reference_motion\",\"args\":{\"name\":\"no\"}}]}\n"
    "User: what is 2 plus 2? => {\"plan\":[{\"call\":\"tap_morse\",\"args\":{\"text\":\"4\"}}]}\n"
    "User: do a big wave then dance => {\"plan\":[{\"call\":\"reference_motion\",\"args\":{\"name\":\"big_wave\"}},{\"call\":\"reference_motion\",\"args\":{\"name\":\"dance\"}}]}\n"
    "User: draw a circle then wave => {\"plan\":[{\"call\":\"draw_shape\",\"args\":{\"shape\":\"circle\",\"size_mm\":60}},{\"call\":\"wave\",\"args\":{\"repetitions\":1}}]}\n"
    "User: which is better cats or dogs? => {\"plan\":[{\"call\":\"tap_morse\",\"args\":{\"text\":\"dogs\"}}]} (choose one)\n"
    "User: are you a human? => {\"plan\":[{\"call\":\"reference_motion\",\"args\":{\"name\":\"no\"}}]}\n"
    "User: can you hear me? => {\"plan\":[{\"call\":\"reference_motion\",\"args\":{\"name\":\"yes\"}}]}\n"
    "If truly unsure: use reference_motion dunno. Return ONLY JSON.\n"
)


class SimpleToolsPlanner:
    """Planner that prefers LLM planning, with a deterministic fallback if model load fails."""
    def __init__(self) -> None:
        self._loaded = False
        self._failed = False  # model load failure flag
        self._executor = ThreadPoolExecutor(max_workers=1)
        # Tracks which pathway produced last plan: 'llm', 'salvage', or 'rule'
        self.last_origin = "unknown"
        self._ollama_fail_count = 0  # consecutive failures/timeouts for Ollama
        self._cache = {}

    def get_last_origin(self) -> str:
        return getattr(self, 'last_origin', 'unknown')

    # --- model loading -------------------------------------------------
    def _ensure_model(self):
        if self._loaded or self._failed:
            return
        

        # Gemini mode (opt-in via env). If configured, skip local load.
        self._gemini_model = os.getenv("LEROBOT_GEMINI_MODEL") or os.getenv("GEMINI_MODEL")
        if self._gemini_model and os.getenv("GEMINI_API_KEY"):
            print(f"[Planner] Gemini configured (model={self._gemini_model}); skipping local model load.")
            self._remote_endpoint = None
            self._loaded = False
            return

# Optional: remote OpenAI-compatible (e.g., vLLM or Ollama) endpoint for gpt-oss if provided
        self._remote_endpoint = os.getenv("LEROBOT_OPENAI_BASE") or os.getenv("OPENAI_BASE_URL")
        self._remote_api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LEROBOT_OPENAI_KEY")
        # User override to skip any local model loading entirely
        if os.getenv("LEROBOT_SKIP_LOCAL"):
            print("[Planner] LEROBOT_SKIP_LOCAL=1 -> skipping local model load (rule / remote / Ollama only).")
            self._failed = True
            return
        # If remote endpoint explicitly set and we want to defer local loading, just return (generation will use HTTP)
        if self._remote_endpoint:
            print(f"[Planner] Remote endpoint configured ({self._remote_endpoint}); skipping local model load attempt.")
            return
        # Ollama mode: if user sets Ollama model env, skip local HF load so _gen can call Ollama directly
        if os.getenv("LEROBOT_OLLAMA_MODEL") or os.getenv("OLLAMA_MODEL"):
            if getattr(self, '_ollama_disabled', False):
                print("[Planner] Ollama disabled; attempting local fallback model load.")
            else:
                if not getattr(self, '_ollama_notice_printed', False):
                    print("[Planner] Ollama model env detected; using Ollama for generation.")
                    self._ollama_notice_printed = True
                return
        # Prevent huge 20B model CPU load unless explicitly allowed
        try:
            import torch  # type: ignore
            no_gpu = not torch.cuda.is_available()
        except Exception:
            no_gpu = True
        model_name_lower = (model_cfg.model_local_dir or model_cfg.model_id or '').lower()
        if ('20b' in model_name_lower or '30b' in model_name_lower) and no_gpu and not os.getenv("LEROBOT_ALLOW_CPU_20B"):
            print(f"[Planner] Detected large model ({model_name_lower}) with no GPU; skipping local load (set LEROBOT_ALLOW_CPU_20B=1 to force). Using fallback planning.")
            self._failed = True
            return
        # Only import transformers if we actually need a local model
        try:
            from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline  # type: ignore
        except Exception as e:  # transformers missing
            print(f"[Planner] transformers import failed: {e}; using rule fallback")
            self._failed = True
            return
        tried: list[str] = []
        primary = model_cfg.model_local_dir or model_cfg.model_id
        candidates = [primary, *getattr(model_cfg, "fallback_model_ids", [])]
        # We'll append remote fallback candidates if all local attempts fail
        remote_fallbacks = [
            "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            "microsoft/Phi-3-mini-4k-instruct",
            "mistralai/Mistral-7B-Instruct-v0.2",
        ]
        for cp in candidates:
            try:
                print(f"[Planner] Attempting model load: {cp}")
                local_only = os.path.isdir(cp)
                # Monkey-patch open to force UTF-8 decoding for model files to bypass Windows cp1252 issues
                import builtins, sys
                orig_open = builtins.open
                base_abs = os.path.abspath(cp)
                def utf8_open(file, mode='r', *a, **k):
                    try:
                        if 'b' not in mode and isinstance(file, str):
                            f_abs = os.path.abspath(file)
                            if f_abs.startswith(base_abs):
                                k.setdefault('encoding', 'utf-8')
                                k.setdefault('errors', 'replace')
                    except Exception:
                        pass
                    return orig_open(file, mode, *a, **k)
                builtins.open = utf8_open
                print(f"[Planner] Filesystem encoding: {sys.getfilesystemencoding()}")
                self.tokenizer = AutoTokenizer.from_pretrained(
                    cp,
                    trust_remote_code=True,
                    local_files_only=local_only,
                )
                self.model = AutoModelForCausalLM.from_pretrained(
                    cp,
                    trust_remote_code=True,
                    dtype="auto",
                    device_map=model_cfg.device_map,
                    local_files_only=local_only,
                )
                from transformers import pipeline as _pipeline  # type: ignore
                # Use text-generation pipeline but we'll feed chat-formatted text using tokenizer.apply_chat_template
                self.pipe = _pipeline(
                    "text-generation",
                    model=self.model,
                    tokenizer=self.tokenizer,
                )
                print(f"[Planner] Loaded model: {cp}")
                builtins.open = orig_open  # restore
                self._loaded = True
                return
            except Exception as e:
                print(f"[Planner] Failed to load {cp}: {e}")
                try:
                    builtins.open = orig_open  # ensure restore if failed
                except Exception:
                    pass
                # Special diagnostic for Windows charmap decode issues
                if "charmap" in str(e).lower() and os.path.isdir(cp):
                    print("[Planner] Running charmap diagnostic scan...")
                    suspect_ext = {"json","md","txt","jinja","py","policy","cfg"}
                    for root, _, files in os.walk(cp):
                        for fn in files:
                            ext = fn.rsplit('.',1)[-1].lower() if '.' in fn else ''
                            if ext not in suspect_ext:
                                continue
                            fpath = os.path.join(root, fn)
                            try:
                                with open(fpath, 'r') as fh:  # default encoding (may trigger)
                                    fh.read(200)
                            except Exception as fe:
                                print(f"[Planner][CHARMAP] Problem file: {fpath}: {fe}")
                tried.append(cp)
        print(f"[Planner] All model loads failed; using deterministic rule fallback. Tried: {tried}")
        # Try remote fallbacks (skip if no network or already tried)
        for rid in remote_fallbacks:
            if rid in tried:
                continue
            try:
                print(f"[Planner] Attempting remote fallback model: {rid}")
                from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline as _pipeline  # type: ignore
                self.tokenizer = AutoTokenizer.from_pretrained(rid, trust_remote_code=True, local_files_only=False)
                self.model = AutoModelForCausalLM.from_pretrained(
                    rid,
                    trust_remote_code=True,
                    dtype="auto",
                    device_map=model_cfg.device_map,
                    local_files_only=False,
                )
                self.pipe = _pipeline(
                    "text-generation",
                    model=self.model,
                    tokenizer=self.tokenizer,
                    max_new_tokens=max(96, model_cfg.max_new_tokens),
                    do_sample=True,
                    temperature=0.5,
                    top_p=0.9,
                    repetition_penalty=1.05,
                )
                print(f"[Planner] Loaded remote fallback: {rid}")
                self._loaded = True
                return
            except Exception as e:
                print(f"[Planner] Remote fallback {rid} failed: {e}")
                tried.append(rid)
        self._failed = True

    # --- rule fallback -------------------------------------------------
    def _rule_plan(self, text: str) -> List[Dict[str, Any]]:
        t = text.lower().strip()
        if not t or t in {"stop", "exit", "quit"}:
            return []
        # yes/no question detection
        yn_prefixes = ("is ", "are ", "do ", "does ", "can ", "will ", "would ", "should ")
        if t.endswith("?"):
            if any(t.startswith(p) for p in yn_prefixes):
                lower = t
                negative_patterns = [
                    ("sky" in lower and "green" in lower),
                    ("elephant" in lower and "moon" in lower),
                    ("are you a human" in lower),
                ]
                positive_patterns = [
                    ("understand" in lower),
                    ("listening" in lower),
                    ("hear" in lower and "me" in lower),
                    ("can you hear me" in lower),
                ]
                if any(negative_patterns):
                    yn = "no"
                elif any(positive_patterns):
                    yn = "yes"
                else:
                    yn = "yes"
                return [{"call": "reference_motion", "args": {"name": yn}}]
            # open factual question -> morse answer where possible
            # simple arithmetic: what is 2 plus 2, 3 * 7, etc.
            import re, math
            expr = t
            expr = expr.replace("what is", "").replace("what's", "")
            word_map = {"plus": "+", "minus": "-", "times": "*", "multiplied by": "*", "x": "*", "divided by": "/", "over": "/"}
            for k,v in word_map.items():
                expr = expr.replace(k, v)
            expr = re.sub(r"[^0-9+\-*/(). ]", "", expr)
            expr = expr.strip(" ?")
            answer = None
            if expr and any(op in expr for op in "+-*/"):
                try:
                    # Very small sandbox: only digits and operators validated above
                    answer_val = eval(expr, {"__builtins__": {}}, {})  # nosec - controlled expression
                    if isinstance(answer_val, (int, float)) and not isinstance(answer_val, bool):
                        if abs(answer_val - int(answer_val)) < 1e-9:
                            answer = str(int(answer_val))
                        else:
                            answer = (f"{answer_val:.3g}")
                except Exception:
                    pass
            if answer:
                return [{"call": "tap_morse", "args": {"text": answer}}]
            if "paper" in t:
                return [{"call": "tap_morse", "args": {"text": "cellulose"}}]
            return [{"call": "reference_motion", "args": {"name": "dunno"}}]
        # Imperatives / motions
        if "big wave" in t:
            return [{"call": "reference_motion", "args": {"name": "big_wave"}}]
        if "wave" in t:
            return [{"call": "wave", "args": {"repetitions": 1}}]
        if "gripper" in t and ("open" in t or "close" in t):
            seq = []
            if "open" in t:
                seq.append({"call":"open_gripper","args":{}})
            if "close" in t:
                if seq:
                    seq.append({"call":"wait","args":{"seconds":0.4}})
                seq.append({"call":"close_gripper","args":{}})
            return seq
        if "karate" in t or "chop" in t:
            # Improved chop: wind-up, fast forward wrist + elbow, retract. Executor will auto-home after.
            return [{"call": "trajectory", "args": {"steps": [
                {"relative_move": {"shoulder_pan": -160, "elbow_flex": 300}},
                {"wait": 0.2},
                {"relative_move": {"wrist_flex": 350}},
                {"wait": 0.12},
                {"relative_move": {"wrist_flex": -350, "elbow_flex": -300, "shoulder_pan": 160}},
            ]}}]
        if "big wave" in t or ("wave" in t and "big" in t):
            return [{"call": "reference_motion", "args": {"name": "big_wave"}}]
        if t.startswith("move") or t.startswith("do a move") or t == "move":
            return [{"call": "trajectory", "args": {"steps": [
                {"relative_move": {"shoulder_pan": -300, "elbow_flex": 250}}, {"wait": 0.4},
                {"relative_move": {"shoulder_pan": 600, "wrist_flex": -200}}, {"wait": 0.4},
                {"relative_move": {"shoulder_pan": -300, "elbow_flex": -250, "wrist_flex": 200}}
            ]}}]
        if "tap" in t and "morse" in t:
            parts = t.split()
            word = "sos"
            try:
                idx = parts.index("tap")
                if idx + 1 < len(parts):
                    word = parts[idx + 1]
            except Exception:
                pass
            return [{"call": "tap_morse", "args": {"text": word}}]
        if "dance" in t or "funny" in t:
            return [{"call": "reference_motion", "args": {"name": "dance"}}]
        # default expressive small flourish trajectory
        return [{"call": "trajectory", "args": {"steps": [
            {"relative_move": {"shoulder_pan": 100}}, {"wait": 0.3}, {"relative_move": {"shoulder_pan": -100}}
        ]}}]
    # end _rule_plan

    # --- context -----------------------------------------------------------
    def _context(self) -> str:
        calib = load_calibration() or {}
        limits = load_joint_limits() or {}
        refs = load_references() or {}
        parts: List[str] = []
        if calib:
            def fmt_val(v):
                try:
                    if isinstance(v,(int,float)):
                        return f"{v:.2f}"
                    return str(v)[:12]
                except Exception:
                    return "?"
            parts.append("Calibration: " + ", ".join(f"{k}:{fmt_val(v)}" for k,v in list(calib.items())[:6]))
        if limits:
            parts.append("JointLimitsPresent")
        if refs:
            parts.append("ReferenceMotions: " + ", ".join(sorted(refs.keys())))
        return ("\nContext:\n" + "\n".join(parts) + "\n") if parts else "\n"

    # --- generation with timeout ------------------------------------------
    def _gen(self, prompt: str) -> str:
        """Generate model output, returning only the newly generated suffix."""
        self._ensure_model()
        # Remote endpoint path (OpenAI compatible). If configured, use HTTP API.
        if self._remote_endpoint and not self._loaded and not self._failed:
            try:
                import requests, uuid
                headers = {"Content-Type": "application/json"}
                if self._remote_api_key:
                    headers["Authorization"] = f"Bearer {self._remote_api_key}"
                messages = prompt  # already a messages list serialized by caller if remote
                resp = requests.post(
                    self._remote_endpoint.rstrip("/") + "/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": model_cfg.model_id,
                        "messages": messages,
                        "max_tokens": max(96, model_cfg.max_new_tokens),
                        "temperature": 0.5,
                    },
                    timeout=model_cfg.timeout_s,
                )
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return content
            except Exception as e:
                print(f"[Planner] Remote endpoint generation failed: {e}")
                raise
        # Ollama fallback: if env var specifies model, call Ollama local API (no need for local HF load)
        ollama_model = os.getenv("LEROBOT_OLLAMA_MODEL") or os.getenv("OLLAMA_MODEL")
        if ollama_model and not self._loaded and not self._failed:
            try:
                import requests, json as _json
                # One-time reachability check to avoid repeated long timeouts
                if not getattr(self, '_ollama_reachability_checked', False):
                    self._ollama_reachability_checked = True
                    try:
                        requests.get("http://localhost:11434/api/version", timeout=2)
                    except Exception as _e_chk:
                        print(f"[Planner] Ollama unreachable: {_e_chk}; switching to rule fallback.")
                        self._failed = True
                        raise
                system_txt, user_txt = prompt.split("\nUser:", 1)
                user_txt = user_txt.replace("\nAssistant:", "").strip()
                reasoning_level = model_cfg.reasoning_level
                system_full = SYSTEM_SPEC.replace("{reasoning_level}", reasoning_level) + "\n" + system_txt
                base_messages = [
                    {"role": "system", "content": system_full},
                    {"role": "user", "content": user_txt},
                ]
                def _stream_collect(msgs, temp=0.25, format_json: bool = False):
                    # Allow larger read timeout for first-token latency with 20B model
                    read_timeout = float(os.getenv('LEROBOT_OLLAMA_READ_TIMEOUT_S', '180'))
                    connect_timeout = 5
                    keep_alive = os.getenv('LEROBOT_OLLAMA_KEEP_ALIVE', '10m')
                    start_time = time.time()
                    print(f"[Planner][Ollama] POST /api/chat model={ollama_model} temp={temp} timeout={read_timeout}s" + (" format=json" if format_json else ""))
                    payload = {
                        "model": ollama_model,
                        "messages": msgs,
                        "stream": True,
                        "options": {
                            "temperature": temp,
                            "top_p": 0.9,
                            "num_predict": max(128, model_cfg.max_new_tokens),
                            # leave other sampler params default for stability
                        },
                        "keep_alive": keep_alive,
                    }
                    if format_json:
                        payload["format"] = "json"
                    with requests.post(
                        "http://localhost:11434/api/chat",
                        json=payload,
                        timeout=(connect_timeout, read_timeout),
                        stream=True,
                    ) as resp:
                        print(f"[Planner][Ollama] HTTP {resp.status_code} in {time.time()-start_time:.2f}s")
                        buf = ''
                        last_yield_time = time.time()
                        total_bytes = 0
                        first_token_time = None
                        first_token_deadline = float(os.getenv('LEROBOT_OLLAMA_FIRST_TOKEN_S', '120'))
                        for line in resp.iter_lines(decode_unicode=True, chunk_size=256):
                            if not line:
                                # heartbeat timeout safeguard
                                if time.time() - last_yield_time > read_timeout:
                                    print("[Planner][Ollama] Stream idle timeout break.")
                                    break
                                continue
                            try:
                                js = json.loads(line)
                            except Exception:
                                total_bytes += len(line)
                                continue
                            if js.get('error'):
                                print(f"[Planner][Ollama] Error event: {js.get('error')}")
                                break
                            delta = js.get('message', {}).get('content') or js.get('response', '')
                            if delta:
                                last_yield_time = time.time()
                                buf += delta
                                total_bytes += len(delta)
                                if first_token_time is None:
                                    first_token_time = last_yield_time
                                    print(f"[Planner][Ollama] First token after {first_token_time-start_time:.2f}s")
                                if len(buf) < 400 and len(buf) % 40 < len(delta):  # periodic short progress line
                                    print(f"[Planner][Ollama] Partial so far ({len(buf)} chars): {buf[:80].replace(chr(10),' ')}...")
                                bs = self._early_balance(buf)
                                if bs:
                                    elapsed = time.time()-start_time
                                    print(f"[Planner][Ollama] Early balanced JSON captured at {elapsed:.2f}s ({len(buf)} chars, {total_bytes} bytes)")
                                    return bs
                            if first_token_time is None and (time.time() - start_time) > first_token_deadline:
                                print(f"[Planner][Ollama] No first token within {first_token_deadline}s; aborting stream.")
                                break
                        elapsed = time.time()-start_time
                        print(f"[Planner][Ollama] Stream ended elapsed={elapsed:.2f}s chars={len(buf)} bytes={total_bytes} first_token={(first_token_time-start_time):.2f}s" if buf else f"[Planner][Ollama] Stream ended with EMPTY content after {elapsed:.2f}s")
                        return buf
                content = _stream_collect(base_messages)
                if not content.strip().startswith('{') or '"plan"' not in content:
                    reprompt_msgs = base_messages + [{"role": "user", "content": "ONLY output one JSON object with key plan now (no text outside)."}]
                    content2 = _stream_collect(reprompt_msgs, temp=0.2)
                    if (not content2) or (not content2.strip().startswith('{')) or ('"plan"' not in content2):
                        # Final attempt: force JSON mode at the API level to nudge well-formed output
                        content3 = _stream_collect(reprompt_msgs, temp=0.1, format_json=True)
                        if content3 and content3.strip().startswith('{') and '"plan"' in content3:
                            return content3
                    if content2 and content2.strip().startswith('{') and '"plan"' in content2:
                        content = content2
                return content
            except Exception as e:
                print(f"[Planner] Ollama generation failed: {e}")
                # Disable Ollama path for this run; mark failed to avoid local pipe usage (not loaded)
                self._ollama_disabled = True
                self._failed = True
                return ""  # trigger fallback logic
        attempts = 0
        while attempts < 2:
            try:
                # Build messages in harmony format and then convert to a single prompt via chat template
                # 'prompt' here is actually the system+context+user concatenated string; we repack for chat template.
                system_txt, user_txt = prompt.split("\nUser:", 1)
                user_txt = user_txt.replace("\nAssistant:", "").strip()
                reasoning_level = model_cfg.reasoning_level
                system_full = SYSTEM_SPEC.replace("{reasoning_level}", reasoning_level) + "\n" + system_txt
                messages = [
                    {"role": "system", "content": system_full},
                    {"role": "user", "content": user_txt},
                ]
                # Apply chat template
                try:
                    chat_formatted = self.tokenizer.apply_chat_template(
                        messages,
                        add_generation_prompt=True,
                        tokenize=False,
                    )
                except Exception:
                    # Fallback: simple concatenation
                    chat_formatted = system_full + "\nUser: " + user_txt + "\nAssistant:"
                out_full = self.pipe(
                    chat_formatted,
                    max_new_tokens=max(96, model_cfg.max_new_tokens),
                    do_sample=True,
                    temperature=0.5,
                    top_p=0.9,
                    repetition_penalty=1.05,
                )[0]["generated_text"]
                # Extract only the assistant completion after the last 'Assistant:' marker or chat template terminator
                if "Assistant:" in out_full:
                    out = out_full.split("Assistant:", 1)[1]
                else:
                    out = out_full
                print(f"[Planner] Raw generation tail: {out[:240].replace(chr(10),' ')}...")
                return out
            except Exception as e:
                attempts += 1
                print(f"[Planner] Generation error attempt {attempts}: {e}")
                time.sleep(0.5)
        raise TimeoutError("Generation failed after retries")

    def _with_timeout(self, fn, *a, **kw) -> Optional[str]:
        fut = self._executor.submit(fn, *a, **kw)
        to = kw.pop('timeout', None) if 'timeout' in kw else max(10, model_cfg.timeout_s)
        try:
            return fut.result(timeout=to)
        except Exception as e:
            print(f"[Planner] _with_timeout exception after {to}s: {e}")
            fut.cancel()
            return None
    # helper for early streaming capture
    def _early_balance(self, s: str) -> Optional[str]:
        depth_curly = 0; start = -1; depth_square = 0
        for i,ch in enumerate(s):
            if ch == '{':
                if depth_curly == 0:
                    start = i
                depth_curly += 1
            elif ch == '}':
                if depth_curly > 0:
                    depth_curly -= 1
            elif ch == '[':
                if start != -1:
                    depth_square += 1
            elif ch == ']':
                if start != -1 and depth_square > 0:
                    depth_square -= 1
            if depth_curly == 0 and start != -1:
                frag = s[start:i+1]
                # ensure square brackets also balanced inside fragment
                if depth_square == 0 and frag.count('[') == frag.count(']'):
                    try:
                        obj = json.loads(frag)
                        plan = obj.get('plan') if isinstance(obj, dict) else None
                        if getattr(self, '_expect_multi', False):
                            # If expecting multiple steps (based on user text) but only 1 so far, keep streaming
                            if isinstance(plan, list) and len(plan) < 2:
                                continue
                        return frag
                    except Exception:
                        pass
        return None

    # --- repair ------------------------------------------------------------
    def _repair_to_json(self, user_text: str, raw: str) -> Optional[List[Dict[str, Any]]]:
        """Heuristic repair: interpret natural language or fragmentary tool mentions into a plan list."""
        if not raw:
            return None
        low_u = user_text.lower()
        low = raw.lower()
        plan: List[Dict[str, Any]] = []
        # Preference: if question with A or B and contains 'or'
        if low_u.endswith('?') and (' or ' in low_u) and any(w in low_u for w in ['better','prefer','favorite']):
            import re, hashlib
            pair_matches = re.findall(r"\b([a-z0-9]{2,})\b\s+or\s+\b([a-z0-9]{2,})\b", low_u)
            if pair_matches:
                a,b = pair_matches[-1]
                hv = int(hashlib.sha256(user_text.encode('utf-8')).hexdigest(),16)
                choice = a if hv % 2 == 0 else b
                return [{"call":"tap_morse","args":{"text":choice}}]
        def add(step):
            plan.append(step)
        if any(k in low for k in ['open the gripper','open gripper']):
            add({"call":"open_gripper","args":{}})
        if any(k in low for k in ['close the gripper','close gripper']):
            if plan and plan[-1]['call'] == 'open_gripper':
                add({"call":"wait","args":{"seconds":0.4}})
            add({"call":"close_gripper","args":{}})
        if 'big wave' in low:
            add({"call":"reference_motion","args":{"name":"big_wave"}})
        elif 'wave' in low:
            add({"call":"wave","args":{"repetitions":1}})
        if 'karate' in low or 'chop' in low:
            add({"call":"trajectory","args":{"steps":[{"relative_move":{"shoulder_pan":-160,"elbow_flex":300}},{"wait":0.2},{"relative_move":{"wrist_flex":350}},{"wait":0.12},{"relative_move":{"wrist_flex":-350,"elbow_flex":-300,"shoulder_pan":160}}]}})
        if 'dance' in low or 'funny' in low:
            add({"call":"reference_motion","args":{"name":"dance"}})
        if 'draw' in low and ('circle' in low or 'square' in low):
            shape = 'circle' if 'circle' in low else 'square'
            add({"call":"draw_shape","args":{"shape":shape,"size_mm":60}})
        # Morse explicit
        if 'morse' in low and 'tap' in low:
            import re
            m = re.search(r'tap(?: morse)? ([a-z0-9]+)', low)
            word = m.group(1) if m else 'sos'
            add({"call":"tap_morse","args":{"text":word}})
        # Arithmetic leftover inside raw
        if not plan and any(sym in low_u for sym in ['+','-','*','/']) and 'plan' not in low:
            import re
            expr = low_u
            expr = expr.replace('what is','').replace("what's",'')
            expr = expr.replace('plus','+').replace('minus','-').replace('times','*').replace('multiplied by','*').replace('x','*').replace('divided by','/').replace('over','/')
            expr = re.sub(r"[^0-9+\-*/(). ]","", expr).strip(' ?')
            if expr and any(op in expr for op in '+-*/'):
                try:
                    val = eval(expr,{"__builtins__":{}},{})
                    if isinstance(val,(int,float)) and not isinstance(val,bool):
                        sval = str(int(val)) if abs(val-int(val))<1e-9 else f"{val:.3g}"
                        return [{"call":"tap_morse","args":{"text":sval}}]
                except Exception:
                    pass
        return plan or None

    # --- public ------------------------------------------------------------
    def plan(self, user_text: str) -> List[Dict[str, Any]]:
        text = user_text.strip()
        if not text:
            return []
        if text in self._cache:
            cached = self._cache[text]
            # shallow copy to avoid mutation
            return [dict(step) for step in cached]
        if text.lower() in {"stop", "exit", "quit"}:
            return []
        # Respect skip-local env immediately so we don't invoke _gen/ensure_model first
        if os.getenv("LEROBOT_SKIP_LOCAL") and not self._failed:
            self._failed = True
        # Fast arithmetic / numeric extraction before any model call (reduces latency and avoids JSON failures)
        low = text.lower()
        if any(k in low for k in [" plus "," minus "," times "," divided by ","*","/","+"]):
            import re
            expr = low
            expr = expr.replace("what is", "").replace("what's", "")
            mapping = {"plus":"+","minus":"-","times":"*","multiplied by":"*","x":"*","divided by":"/","over":"/"}
            for k,v in mapping.items():
                expr = expr.replace(k, v)
            expr = re.sub(r"[^0-9+\-*/(). ]","", expr)
            expr = expr.strip(" ?")
            if expr and any(op in expr for op in "+-*/"):
                try:
                    val = eval(expr, {"__builtins__": {}}, {})  # nosec controlled
                    if isinstance(val,(int,float)) and not isinstance(val,bool):
                        if abs(val-int(val))<1e-9:
                            return [{"call":"tap_morse","args":{"text":str(int(val))}}]
                        return [{"call":"tap_morse","args":{"text":f"{val:.3g}"}}]
                except Exception:
                    pass
        # Subjective preference / comparison detection -> choose one option deterministically
        if any(w in low for w in [" better ", " favorite ", " prefer "]) and low.endswith("?"):
            import re  # ensure availability in this local scope (Windows quirk in inline eval context)
            pair_matches = re.findall(r"\b([a-z0-9]{2,})\b\s+or\s+\b([a-z0-9]{2,})\b", low)
            chosen = None
            if pair_matches:
                a, b = pair_matches[-1]
                hv = int(hashlib.sha256(text.encode('utf-8')).hexdigest(), 16)
                chosen = a if (hv % 2 == 0) else b
            if chosen:
                return [{"call": "tap_morse", "args": {"text": chosen}}]
            return [{"call":"reference_motion","args":{"name":"dunno"}}]
        if self._failed:
            # If failed but Ollama or remote endpoint is configured we can still try _gen; else immediate fallback
            if not (os.getenv('LEROBOT_OLLAMA_MODEL') or os.getenv('OLLAMA_MODEL') or os.getenv('LEROBOT_OPENAI_BASE') or os.getenv('OPENAI_BASE_URL')):
                return self._rule_plan(text)
        prompt = SYSTEM_SPEC.replace("{reasoning_level}", model_cfg.reasoning_level) + self._context() + f"User: {text}\nAssistant:"
        # Adaptive timeout: extend for large 20B model unless user supplied larger via env
        timeout_override = os.getenv('LEROBOT_TIMEOUT_S')
        base_timeout = model_cfg.timeout_s
        if timeout_override:
            try:
                base_timeout = max(base_timeout, int(timeout_override))
            except Exception:
                pass
        if '20b' in (model_cfg.model_id or '').lower() and base_timeout < 120:
            base_timeout = 120
        # Also adapt if only Ollama env indicates 20B model
        ollama_env_model = os.getenv('LEROBOT_OLLAMA_MODEL') or os.getenv('OLLAMA_MODEL') or ''
        if '20b' in ollama_env_model.lower() and base_timeout < 180:
            base_timeout = max(base_timeout, 180)
        print(f"[Planner] Final generation timeout (seconds): {base_timeout}")
        # Set expectation flag for early capture logic
        low_user = text.lower()
        self._expect_multi = any(tok in low_user for tok in [' then ', ' and then ', ' and ', ' after '])
        use_ollama = bool(ollama_env_model)
        if use_ollama:
            # Call directly (streaming handles its own internal timeouts); avoid outer timeout cutting it short
            try:
                raw = self._gen(prompt)
            except Exception as e:
                print(f"[Planner] Direct Ollama generation exception: {e}")
                raw = None
        else:
            raw = self._with_timeout(lambda p=prompt: self._gen(p), timeout=base_timeout)
        if raw is None:
            print("[Planner] Generation timeout or exception; attempting rule fallback.")
            if os.getenv("LEROBOT_OLLAMA_MODEL") or os.getenv("OLLAMA_MODEL"):
                self._ollama_fail_count += 1
                if self._ollama_fail_count >= 2:
                    self._ollama_disabled = True
                    self._failed = True
            self.last_origin = 'rule'
            return self._rule_plan(text)
        # extract first JSON object
        def _balanced_slice(s: str):
            depth=0; start=-1
            for i,ch in enumerate(s):
                if ch=='{':
                    if depth==0: start=i
                    depth+=1
                elif ch=='}' and depth>0:
                    depth-=1
                    if depth==0 and start!=-1:
                        return s[start:i+1]
            return None
        cand = _balanced_slice(raw)
        m = None
        if cand:
            try:
                json.loads(cand)
                m = cand
            except Exception:
                m = None
        if not m:
            print("[Planner] No JSON object found; forcing second JSON reprompt.")
            refine_force = prompt + "\n(Return ONLY a JSON object with a 'plan' key now. No prose.)\nAssistant:"
            if use_ollama:
                try:
                    raw_force = self._gen(refine_force)
                except Exception as e:
                    print(f"[Planner] Second Ollama attempt exception: {e}")
                    raw_force = None
            else:
                raw_force = self._with_timeout(self._gen, refine_force)
            if raw_force:
                cand2 = _balanced_slice(raw_force)
                if cand2:
                    try:
                        json.loads(cand2)
                        m = cand2
                    except Exception:
                        pass
            if not m:
                print("[Planner] Still no JSON; attempting repair then salvage.")
                repaired = self._repair_to_json(text, (raw_force or '') + '\n' + raw)
                if repaired:
                    print("[Planner] Repair succeeded.")
                    self.last_origin = 'salvage'
                    return repaired
                salvage = self._salvage_plan(text, (raw_force or '') + '\n' + raw)
                if salvage:
                    print("[Planner] Salvage succeeded.")
                    self.last_origin = 'salvage'
                    return salvage
                print("[Planner] Salvage failed; using rule fallback.")
                self.last_origin = 'rule'
                return self._rule_plan(text)
        try:
            obj = json.loads(m if isinstance(m,str) else m.group(0))
            plan = obj.get("plan")
            if isinstance(plan, list):
                # Light validation: ensure each step has 'call'
                cleaned: List[Dict[str, Any]] = []
                for step in plan:
                    if not isinstance(step, dict):
                        continue
                    call = step.get("call") or step.get("action")
                    if not isinstance(call, str):
                        continue
                    args = step.get("args") if isinstance(step.get("args"), dict) else {}
                    if call == "reference_motion" and "name" not in args and "motion" in args:
                        args["name"] = args.pop("motion")
                    cleaned.append({"call": call, "args": args})
                if cleaned:
                    low = text.lower()
                    if low.endswith('?') and not any(s['call'] in ("tap_morse","reference_motion") for s in cleaned):
                        repl = self._rule_plan(text)
                        if repl and repl[0]['call'] == 'tap_morse':
                            cleaned = [repl[0]]
                    # Minimal corrective pass
                    if (len(cleaned) == 1 and cleaned[0]["call"] == "reference_motion" and cleaned[0]["args"].get("name") == "yes"):
                        imperative_verbs = ("wave", "open", "close", "draw", "tap", "karate", "punch", "move", "make", "perform", "do ")
                        low = text.lower()
                        is_question = low.endswith("?") or low.startswith(("is ", "are ", "do ", "does ", "can ", "will "))
                        if (not is_question) and any(v in low for v in imperative_verbs):
                            print("[Planner] Incorrect trivial yes motion for imperative; requesting refinement.")
                            refine = prompt + "\n(Note: Previous attempt incorrectly used reference_motion yes. Provide a correct tool plan.)\nAssistant:"
                            raw2 = self._with_timeout(self._gen, refine)
                            if raw2 is None and use_ollama:
                                try:
                                    raw2 = self._gen(refine)
                                except Exception as e:
                                    print(f"[Planner] Refinement Ollama exception: {e}")
                            if raw2:
                                m2 = re.search(r"\{[\s\S]*\}", raw2)
                                if m2:
                                    try:
                                        obj2 = json.loads(m2.group(0))
                                        p2 = obj2.get("plan")
                                    except Exception:
                                        p2 = None
                                    if isinstance(p2, list) and p2:
                                        cleaned2: List[Dict[str, Any]] = []
                                        for s2 in p2:
                                            if isinstance(s2, dict) and isinstance(s2.get("call"), str):
                                                cleaned2.append({"call": s2["call"], "args": s2.get("args", {}) if isinstance(s2.get("args"), dict) else {}})
                                        if cleaned2 and not (len(cleaned2) == 1 and cleaned2[0]["call"] == "reference_motion" and cleaned2[0]["args"].get("name") == "yes"):
                                            print("[Planner] Refinement succeeded.")
                                            return cleaned2
                            print("[Planner] Refinement failed; returning original yes motion.")
                    if cleaned:
                        self.last_origin = 'llm'
                        # store cache (cap size)
                        try:
                            if len(self._cache) > 64:
                                # simple FIFO eviction
                                self._cache.pop(next(iter(self._cache)))
                            self._cache[text] = cleaned
                        except Exception:
                            pass
                        return cleaned
        except Exception as e:
            print(f"[Planner] Parse error: {e}; fallback yes motion.")
            pass
        self.last_origin = 'rule'
        return self._rule_plan(text)

    def _salvage_plan(self, user_text: str, raw: str) -> Optional[List[Dict[str, Any]]]:
        if not raw:
            return None
        tx = raw.lower()
        order = []
        tool_keywords = [
            ('open_gripper', ['open gripper']),
            ('close_gripper', ['close gripper']),
            ('wave', ['wave']),
            ('trajectory:karate', ['karate','chop']),  # prioritize karate over shrug
            ('reference_motion:dance', ['dance','funny']),
            ('reference_motion:yes', [' yes ']),
            ('reference_motion:no', [' no ']),
            ('reference_motion:dunno', ['dunno','shrug']),
            ('draw_shape', ['draw','circle','square']),
            ('tap_morse', ['morse','tap']),
        ]
        for key, kws in tool_keywords:
            for k in kws:
                if k in tx:
                    order.append(key)
                    break
        if not order and any(w in user_text.lower() for w in ['better','favorite','prefer']):
            import re  # local import for consistency
            pair_matches = re.findall(r"\b([a-z0-9]{2,})\b\s+or\s+\b([a-z0-9]{2,})\b", user_text.lower())
            if pair_matches:
                a,b = pair_matches[-1]
                hv = int(hashlib.sha256(user_text.encode('utf-8')).hexdigest(), 16)
                chosen = a if hv % 2 == 0 else b
                return [{'call':'tap_morse','args':{'text':chosen}}]
            order.append('reference_motion:dunno')
        if not order:
            return None
        plan: List[Dict[str, Any]] = []
        for item in order[:6]:  # cap
            if item.startswith('reference_motion:'):
                name = item.split(':',1)[1]
                plan.append({'call':'reference_motion','args':{'name':name}})
            elif item == 'wave':
                plan.append({'call':'wave','args':{'repetitions':1}})
            elif item == 'open_gripper':
                plan.append({'call':'open_gripper','args':{}})
            elif item == 'close_gripper':
                plan.append({'call':'close_gripper','args':{}})
            elif item == 'draw_shape':
                shape = 'circle' if 'circle' in tx else 'square' if 'square' in tx else 'circle'
                plan.append({'call':'draw_shape','args':{'shape':shape,'size_mm':60}})
            elif item == 'trajectory:karate':
                plan.append({'call':'trajectory','args':{'steps':[{'relative_move':{'shoulder_pan':-140,'elbow_flex':260}},{'wait':0.18},{'relative_move':{'wrist_flex':320}},{'wait':0.1},{'relative_move':{'wrist_flex':-320,'elbow_flex':-260,'shoulder_pan':140}}]}})
            elif item == 'tap_morse':
                # crude extraction of number following 'tap'
                import re
                m = re.search(r'tap(?: morse)? ([a-z0-9]+)', tx)
                word = m.group(1) if m else 'sos'
                plan.append({'call':'tap_morse','args':{'text':word}})
        return plan or None