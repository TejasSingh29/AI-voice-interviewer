import { useState, useRef, useCallback } from "react";

/**
 * useSpeechRecognition — Manual stop mode
 * - Starts listening when user clicks mic
 * - Keeps accumulating transcript (continuous = true)
 * - Only fires onTranscript when user manually clicks stop
 * - Never auto-submits mid-sentence
 */
const useSpeechRecognition = ({ onTranscript, onError } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef(null);
  const accumulatedRef = useRef(""); // full answer built up over time
  const manualStopRef = useRef(false); // true = user clicked stop button

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.("Speech recognition not supported. Please use Chrome.");
      return;
    }

    // Clean up previous instance
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.abort();
    }

    accumulatedRef.current = "";
    manualStopRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;      // ← keep listening, don't auto-stop
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
      console.log("🎤 Started listening");
    };

    recognition.onresult = (event) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          // Append finalized sentence to accumulated answer
          accumulatedRef.current += (accumulatedRef.current ? " " : "") + text.trim();
          interim = "";
        } else {
          interim = text;
        }
      }

      // Show accumulated + current interim in the preview
      const preview = accumulatedRef.current
        ? accumulatedRef.current + (interim ? " " + interim : "")
        : interim;

      setInterimTranscript(preview);
    };

    recognition.onend = () => {
      console.log("🎤 Recognition ended. Manual stop:", manualStopRef.current);

      if (manualStopRef.current) {
        // User clicked stop — submit whatever was accumulated
        setIsListening(false);
        setInterimTranscript("");

        const finalText = accumulatedRef.current.trim();
        accumulatedRef.current = "";

        if (finalText) {
          console.log("✅ Submitting:", finalText);
          onTranscript?.(finalText);
        } else {
          onError?.("No speech detected. Please try again.");
        }
      } else {
        // Chrome auto-stopped (continuous mode timeout) — restart silently
        console.log("🔄 Auto-restarting recognition...");
        try {
          recognition.start();
        } catch (e) {
          console.warn("Restart failed:", e.message);
          setIsListening(false);
        }
      }
    };

    recognition.onerror = (event) => {
      console.error("🎤 Error:", event.error);

      if (event.error === "no-speech") {
        // Ignore — continuous mode fires this often, will auto-restart via onend
        return;
      }
      if (event.error === "not-allowed") {
        setIsListening(false);
        onError?.("Microphone access denied. Please allow microphone in browser settings.");
        return;
      }
      if (event.error === "aborted") {
        // Intentional abort — ignore
        return;
      }

      onError?.(`Mic error: ${event.error}`);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      onError?.("Could not start microphone: " + err.message);
    }
  }, [onTranscript, onError]);

  // User clicks stop → flag as manual, then stop recognition
  // onend fires → sees manualStopRef = true → submits text
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    console.log("🛑 Manual stop triggered");
    manualStopRef.current = true;
    recognitionRef.current.stop(); // triggers onend → submits
  }, []);

  return {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
  };
};

export default useSpeechRecognition;