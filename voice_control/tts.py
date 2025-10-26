from __future__ import annotations

try:
    import pyttsx3
    _engine = None
    _PYTTSX3_OK = True
except Exception:
    _PYTTSX3_OK = False
    _engine = None


def tts_say(text: str):
    # Speak directly via pyttsx3 to avoid spawning external players.
    if _PYTTSX3_OK:
        global _engine
        if _engine is None:
            _engine = pyttsx3.init()
            _engine.setProperty("rate", 185)
            _engine.setProperty("volume", 1.0)
        _engine.say(text)
        _engine.runAndWait()
    else:
        print(f"[TTS] {text}")