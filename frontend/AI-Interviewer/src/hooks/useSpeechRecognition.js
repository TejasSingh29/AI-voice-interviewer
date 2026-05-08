import { useState, useRef, useCallback } from "react";

/**
 * useSpeechRecognition — Web Speech API
 * Listens to user speech and returns final transcript.
 * onTranscript(text) is called when user finishes speaking.
 */
const useSpeechRecognition = ({ onTranscript, onError } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");

  const startListening = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = "";

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
      finalTranscriptRef.current = "";
      console.log("🎤 Listening started");
    };

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) setInterimTranscript(interim);
      if (final) {
        finalTranscriptRef.current += final;
        setInterimTranscript("");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      console.log("🎤 Listening ended. Final:", finalTranscriptRef.current);

      if (finalTranscriptRef.current.trim()) {
        onTranscript?.(finalTranscriptRef.current.trim());
        finalTranscriptRef.current = "";
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      setInterimTranscript("");
      console.error("🎤 Speech error:", event.error);

      if (event.error === "no-speech") {
        onError?.("No speech detected. Please try again.");
      } else if (event.error === "not-allowed") {
        onError?.("Microphone access denied. Please allow microphone access.");
      } else if (event.error !== "aborted") {
        onError?.(`Speech error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error("Recognition start error:", err);
      onError?.("Failed to start microphone.");
    }
  }, [onTranscript, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { isListening, interimTranscript, startListening, stopListening };
};

export default useSpeechRecognition;