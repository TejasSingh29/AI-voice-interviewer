import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { interviewService, ttsService } from "../services/interviewService";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import useTTS from "../hooks/useTTS";
import MicButton from "../components/MicButton";
import TranscriptPanel from "../components/TranscriptPanel";
import VoiceWave from "../components/VoiceWave";
import FeedbackCard from "../components/FeedbackCard";
import toast from "react-hot-toast";
import { X, ChevronRight } from "lucide-react";

// Whether to use Whisper (true) or browser SpeechRecognition (false)
const USE_WHISPER = false;

export default function InterviewPage() {
  const { sessionId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [questionNum, setQuestionNum] = useState(1);
  const [maxQuestions, setMaxQuestions] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [phase, setPhase] = useState("interview"); // 'interview' | 'feedback'
  const [feedback, setFeedback] = useState(null);
  const [feedbackMeta, setFeedbackMeta] = useState({});
  const [pendingBlob, setPendingBlob] = useState(null); // for Whisper mode

  const { isSpeaking, speak, stop } = useTTS({ useElevenLabs: true });

  // ── Handle final transcript from STT ────────────────────────────────────
  const handleTranscript = useCallback(
    async (textOrBlob) => {
      let userText = textOrBlob;

      // Whisper mode: textOrBlob is a Blob
      if (USE_WHISPER && textOrBlob instanceof Blob) {
        try {
          setProcessing(true);
          userText = await ttsService.transcribe(textOrBlob);
        } catch {
          toast.error("Transcription failed");
          setProcessing(false);
          return;
        }
      }

      if (!userText || typeof userText !== "string" || !userText.trim()) return;

      // Add user message to UI
      setMessages((prev) => [...prev, { role: "user", content: userText }]);
      setProcessing(true);
      stop(); // stop any AI speech

      try {
        const { data } = await interviewService.respond(sessionId, userText);

        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        setQuestionNum(data.questionNumber);
        setMaxQuestions(data.maxQuestions);

        // Speak the AI response
        speak(data.message);

        if (data.isComplete) {
          setTimeout(() => handleEndInterview(), 1000);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to get response");
      } finally {
        setProcessing(false);
      }
    },
    [sessionId, speak, stop]
  );

  const { isListening, interimTranscript, startListening, stopListening } =
    useSpeechRecognition({
      useWhisper: USE_WHISPER,
      onTranscript: handleTranscript,
      onError: (e) => toast.error(`Mic error: ${e}`),
    });

  // ── Load first message ───────────────────────────────────────────────────
  useEffect(() => {
    if (state?.firstMessage) {
      setMessages([{ role: "assistant", content: state.firstMessage }]);
      speak(state.firstMessage);
    }
  }, []);

  // ── End Interview ────────────────────────────────────────────────────────
  const handleEndInterview = async () => {
    setProcessing(true);
    stop();
    try {
      const { data } = await interviewService.end(sessionId);
      setFeedback(data.feedback);
      setFeedbackMeta({ duration: data.durationMinutes, total: data.totalQuestions });
      setPhase("feedback");
    } catch (err) {
      toast.error("Failed to generate feedback");
    } finally {
      setProcessing(false);
    }
  };

  // ── Toggle mic ───────────────────────────────────────────────────────────
  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const progress = Math.round(((questionNum - 1) / maxQuestions) * 100);

  // ── Feedback Screen ──────────────────────────────────────────────────────
  if (phase === "feedback") {
    return (
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Interview Complete</h1>
            <button onClick={() => navigate("/dashboard")} className="btn-secondary text-sm py-2 px-4">
              Back to Dashboard
            </button>
          </div>
          <FeedbackCard
            feedback={feedback}
            duration={feedbackMeta.duration}
            totalQuestions={feedbackMeta.total}
          />
          <div className="mt-4 flex gap-3">
            <button onClick={() => navigate("/setup")} className="btn-primary flex items-center gap-2">
              <ChevronRight className="w-4 h-4" /> Try Again
            </button>
            <button
              onClick={() => navigate(`/session/${sessionId}`)}
              className="btn-secondary text-sm"
            >
              View Full Transcript
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Interview Screen ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-200">Live Interview</span>
          </div>
          <div className="text-xs text-slate-500">
            Question {Math.min(questionNum, maxQuestions)} of {maxQuestions}
          </div>
        </div>

        <button
          onClick={handleEndInterview}
          disabled={processing}
          className="btn-danger text-sm py-2 px-4 flex items-center gap-2"
        >
          <X className="w-3.5 h-3.5" /> End Interview
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Transcript */}
      <TranscriptPanel messages={messages} interimText={interimTranscript} />

      {/* Bottom controls */}
      <div className="py-6 border-t border-slate-800 mt-2">
        <div className="flex flex-col items-center gap-4">
          {/* Status indicator */}
          <div className="flex items-center gap-3 h-8">
            {isSpeaking && (
              <>
                <span className="text-xs text-brand-400">AI speaking</span>
                <VoiceWave active={true} color="bg-brand-400" />
              </>
            )}
            {isListening && (
              <>
                <VoiceWave active={true} color="bg-red-400" />
                <span className="text-xs text-red-400">Listening...</span>
              </>
            )}
            {processing && !isSpeaking && !isListening && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            )}
          </div>

          <MicButton
            isListening={isListening}
            isSpeaking={isSpeaking}
            onClick={toggleMic}
            disabled={processing}
          />
        </div>
      </div>
    </div>
  );
}