import { useState, useRef, useCallback } from "react";
import { ttsService } from "../services/interviewService";

/**
 * useTTS
 * Speaks text using ElevenLabs (if available) or browser speechSynthesis fallback.
 */
const useTTS = ({ useElevenLabs = true } = {}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  // ── ElevenLabs TTS ───────────────────────────────────────────────────────
  const speakElevenLabs = useCallback(async (text) => {
    try {
      setIsSpeaking(true);
      const blob = await ttsService.synthesize(text);
      const url = URL.createObjectURL(blob);

      // Stop any existing playback
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => setIsSpeaking(false);

      await audio.play();
    } catch (err) {
      console.warn("ElevenLabs TTS failed, falling back to browser:", err.message);
      speakBrowser(text);
    }
  }, []);

  // ── Browser speechSynthesis fallback ────────────────────────────────────
  const speakBrowser = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    // Pick a good English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural"))
    );
    if (preferred) utter.voice = preferred;

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utter);
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────
  const speak = useCallback(
    (text) => {
      if (!text) return;
      if (useElevenLabs && import.meta.env.VITE_USE_ELEVENLABS === "true") {
        speakElevenLabs(text);
      } else {
        speakBrowser(text);
      }
    },
    [useElevenLabs, speakElevenLabs, speakBrowser]
  );

  const stop = useCallback(() => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
};

export default useTTS;