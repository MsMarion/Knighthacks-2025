import queue
import json
import time
import sounddevice as sd

from .config import audio


class _VoskSTT:
    def __init__(self, model_path: str | None = None) -> None:
        from vosk import Model, KaldiRecognizer
        mp = model_path or audio.vosk_model_path
        self.model = Model(mp) if mp else Model(lang="en-us")
        self.rec = KaldiRecognizer(self.model, audio.sample_rate)
        self.rec.SetWords(False)
        self.q: queue.Queue[bytes] = queue.Queue()
        self.stream = None

    def _callback(self, indata, frames, time_info, status):
        if status:  # type: ignore
            pass
        self.q.put(bytes(indata))

    def listen_once(self) -> str:
        self.rec.Reset()
        self.stream = sd.RawInputStream(
            samplerate=audio.sample_rate,
            blocksize=8000,
            device=audio.mic_device,
            dtype="int16",
            channels=1,
            callback=self._callback,
        )
        self.stream.start()
        # collect until extended silence; enforce minimum length
        silence_ms = 0
        ms_per_block = int(1000 * 8000 / audio.sample_rate)
        min_words = int(getattr(audio, "min_words", 2))
        min_chars = int(getattr(audio, "min_chars", 6))
        collected: list[str] = []
        try:
            while True:
                data = self.q.get()
                if self.rec.AcceptWaveform(data):
                    # accumulate but don't return yet; wait for final silence
                    res = json.loads(self.rec.Result())
                    text = (res.get("text", "") or "").strip()
                    if text:
                        collected.append(text)
                    silence_ms = 0
                else:
                    partial = json.loads(self.rec.PartialResult()).get("partial", "")
                    if not partial:
                        silence_ms += ms_per_block
                        if silence_ms > audio.vad_silence_ms:
                            final = (json.loads(self.rec.FinalResult()).get("text", "") or "").strip()
                            full = " ".join([*collected, final]).strip()
                            # enforce a minimal utterance length
                            if len(full) >= min_chars or len(full.split()) >= min_words:
                                return full
                            # else keep listening (reset counters)
                            collected.clear()
                            silence_ms = 0
                    else:
                        silence_ms = 0
        finally:
            self.stream.stop()
            self.stream.close()


class _WhisperSTT:
    def __init__(self) -> None:
        from faster_whisper import WhisperModel
        # small/int8 is a good CPU default
        self.model = WhisperModel("small", device="cpu", compute_type="int8")
        self.q: queue.Queue[bytes] = queue.Queue()
        self.stream = None

    def _callback(self, indata, frames, time_info, status):
        if status:  # type: ignore
            pass
        self.q.put(bytes(indata))

    def listen_once(self) -> str:
        # capture up to max_utterance_s seconds
        duration_s = max(2, int(audio.max_utterance_s))
        self.stream = sd.RawInputStream(
            samplerate=16000,
            blocksize=8000,
            device=audio.mic_device,
            dtype="int16",
            channels=1,
            callback=self._callback,
        )
        self.stream.start()
        buf = bytearray()
        start = time.time()
        try:
            while time.time() - start < duration_s:
                try:
                    data = self.q.get(timeout=0.2)
                    buf.extend(data)
                except Exception:
                    pass
            import numpy as np
            audio_np = np.frombuffer(buf, dtype=np.int16).astype(np.float32) / 32768.0
            segments, info = self.model.transcribe(
                audio_np,
                beam_size=1,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": audio.vad_silence_ms},
            )
            text = " ".join(s.text for s in segments).strip()
            return text
        finally:
            self.stream.stop()
            self.stream.close()


class STT:
    def __init__(self, model_path: str | None = None) -> None:
        import os
        self._text_mode = bool(os.getenv("LEROBOT_TEXT_MODE"))
        if self._text_mode:
            self.impl = None
            return
        if getattr(audio, "prefer_whisper", False):
            try:
                self.impl = _WhisperSTT()
                return
            except Exception:
                pass
        self.impl = _VoskSTT(model_path)

    def listen_once(self) -> str:
        if getattr(self, "_text_mode", False):
            try:
                return input("[TEXT MODE] Command> ").strip()
            except EOFError:
                return ""
        return self.impl.listen_once()