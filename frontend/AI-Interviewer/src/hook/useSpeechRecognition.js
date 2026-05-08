import { useState, useRef, useCallback } from "react";

/**
 * useSpeechRecognition
 * Wraps the Web Speech API + MediaRecorder for dual-mode STT:
 *   - Browser mode: uses SpeechRecognition (free, lower accuracy)
 *   - Whisper mode: records audio blob, sends to backend Whisper API
 */
const useSpeechRecognition = ({ useWhisper = false, onTranscript, onError } = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // ── Browser Speech Recognition ──────────────────────────────────────────
  const startBrowserSTT = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setInterimTranscript(interim);
      if (final) {
        onTranscript?.(final.trim());
        setInterimTranscript("");
      }
    };

    recognition.onerror = (e) => {
      setIsListening(false);
      if (e.error !== "no-speech") onError?.(e.error);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript, onError]);

  // ── MediaRecorder (for Whisper) ──────────────────────────────────────────
  const startWhisperRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        onTranscript?.(blob); // Pass blob upstream — caller sends to Whisper
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch (err) {
      onError?.(err.message);
    }
  }, [onTranscript, onError]);

  // ── Public API ───────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (useWhisper) startWhisperRecording();
    else startBrowserSTT();
  }, [useWhisper, startBrowserSTT, startWhisperRecording]);

  const stopListening = useCallback(() => {
    if (useWhisper) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.stop();
    }
  }, [useWhisper]);

  return { isListening, interimTranscript, startListening, stopListening };
};

export default useSpeechRecognition;