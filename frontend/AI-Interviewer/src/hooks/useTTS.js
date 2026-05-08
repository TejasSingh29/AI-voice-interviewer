import { useState, useRef, useCallback } from "react";

/**
 * useTTS — Browser speechSynthesis (free, no API needed)
 * Falls back gracefully if voices aren't loaded yet.
 */
const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const speak = useCallback((text) => {
    if (!text || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    utter.lang = "en-US";

    // Pick best available English voice
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Google") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel") ||
            v.name.includes("Natural"))
      );
      if (preferred) utter.voice = preferred;
    };

    pickVoice();

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);

    // Chrome bug fix — speechSynthesis pauses after ~15s
    const resumeTimer = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.resume();
      } else {
        clearInterval(resumeTimer);
      }
    }, 10000);

    utter.onend = () => {
      setIsSpeaking(false);
      clearInterval(resumeTimer);
    };
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, stop };
};

export default useTTS;