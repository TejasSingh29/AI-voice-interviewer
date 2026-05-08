import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { interviewService } from "../services/interviewService";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import useTTS from "../hooks/useTTS";
import toast from "react-hot-toast";
import { X, Mic, Square, Bot, User, Volume2 } from "lucide-react";

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
  const [interimText, setInterimText] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle' | 'listening' | 'processing' | 'speaking'
  const bottomRef = useRef(null);

  const { isSpeaking, speak, stop } = useTTS();

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  // Speak AI message when isSpeaking state changes
  useEffect(() => {
    if (isSpeaking) setStatus("speaking");
    else if (!processing) setStatus("idle");
  }, [isSpeaking, processing]);

  // ── Handle final transcript from mic ─────────────────────────────────────
  const handleTranscript = useCallback(
    async (text) => {
      if (!text || !text.trim()) return;
      console.log("📝 User said:", text);

      stop(); // stop AI speech if still talking

      // Show user message immediately
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setProcessing(true);
      setStatus("processing");

      try {
        const { data } = await interviewService.respond(sessionId, text);
        console.log("🤖 AI response:", data.message);

        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
        setQuestionNum(data.questionNumber);
        setMaxQuestions(data.maxQuestions);
        setStatus("speaking");
        speak(data.message);

        if (data.isComplete) {
          setTimeout(() => handleEndInterview(), 2000);
        }
      } catch (err) {
        toast.error(err.response?.data?.error || "Failed to get AI response");
        setStatus("idle");
      } finally {
        setProcessing(false);
      }
    },
    [sessionId, speak, stop]
  );

  const handleError = useCallback((err) => {
    toast.error(err);
    setStatus("idle");
  }, []);

  const { isListening, interimTranscript, startListening, stopListening } =
    useSpeechRecognition({
      onTranscript: handleTranscript,
      onError: handleError,
    });

  // Sync interim transcript to state
  useEffect(() => {
    setInterimText(interimTranscript);
  }, [interimTranscript]);

  // Sync listening state
  useEffect(() => {
    if (isListening) setStatus("listening");
    else if (!processing && !isSpeaking) setStatus("idle");
  }, [isListening, processing, isSpeaking]);

  // ── Load first AI message on mount ───────────────────────────────────────
  useEffect(() => {
    if (state?.firstMessage) {
      setMessages([{ role: "assistant", content: state.firstMessage }]);
      setMaxQuestions(state.maxQuestions || 10);
      // Small delay to let page render first
      setTimeout(() => {
        speak(state.firstMessage);
      }, 500);
    }
  }, []);

  // ── Toggle mic ────────────────────────────────────────────────────────────
  const toggleMic = () => {
    if (processing || isSpeaking) return;
    if (isListening) {
      stopListening();
    } else {
      stop();
      startListening();
    }
  };

  // ── End Interview ─────────────────────────────────────────────────────────
  const handleEndInterview = async () => {
    stop();
    stopListening();
    setProcessing(true);
    setStatus("processing");
    try {
      const { data } = await interviewService.end(sessionId);
      setFeedback(data.feedback);
      setFeedbackMeta({ duration: data.durationMinutes, total: data.totalQuestions });
      setPhase("feedback");
    } catch (err) {
      toast.error("Failed to generate feedback");
    } finally {
      setProcessing(false);
      setStatus("idle");
    }
  };

  const progress = Math.min(Math.round(((questionNum - 1) / maxQuestions) * 100), 100);

  // ── Status UI helpers ─────────────────────────────────────────────────────
  const statusConfig = {
    idle: { label: "Click mic to speak", color: "text-slate-400", bg: "bg-indigo-600 hover:bg-indigo-700" },
    listening: { label: "Listening... click to stop", color: "text-red-400", bg: "bg-red-500 hover:bg-red-600" },
    processing: { label: "AI is thinking...", color: "text-yellow-400", bg: "bg-slate-600 cursor-not-allowed" },
    speaking: { label: "AI is speaking... click to interrupt", color: "text-indigo-400", bg: "bg-indigo-600 hover:bg-indigo-700" },
  };

  const cfg = statusConfig[status];

  // ── Feedback Screen ───────────────────────────────────────────────────────
  if (phase === "feedback") {
    return (
      <div className="min-h-screen px-4 py-8 bg-slate-950">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold text-white mb-6">Interview Complete 🎉</h1>

          {/* Overall score */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center mb-4">
            <div className={`text-5xl font-bold mb-1 ${
              feedback?.overallScore >= 75 ? "text-green-400" :
              feedback?.overallScore >= 50 ? "text-yellow-400" : "text-red-400"
            }`}>
              {feedback?.overallScore ?? "--"}
            </div>
            <div className="text-slate-400 text-sm">Overall Score</div>
            <div className="text-xs text-slate-500 mt-2">
              {feedbackMeta.total} questions · {feedbackMeta.duration} min
            </div>
          </div>

          {/* Score bars */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4 space-y-4">
            {[
              { label: "Communication", score: feedback?.communicationScore, color: "bg-blue-500" },
              { label: "Technical", score: feedback?.technicalScore, color: "bg-purple-500" },
              { label: "Behavioral", score: feedback?.behavioralScore, color: "bg-green-500" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="text-white font-medium">{s.score}/100</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-4">
            <p className="text-slate-300 text-sm leading-relaxed">{feedback?.summary}</p>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-green-400 font-medium text-sm mb-3">✅ Strengths</h3>
              <ul className="space-y-2">
                {feedback?.strengths?.map((s, i) => (
                  <li key={i} className="text-slate-300 text-xs">{s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-yellow-400 font-medium text-sm mb-3">📈 Improve</h3>
              <ul className="space-y-2">
                {feedback?.improvements?.map((s, i) => (
                  <li key={i} className="text-slate-300 text-xs">{s}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/setup")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-xl transition-all"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium px-6 py-3 rounded-xl transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Interview Screen ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-slate-950" style={{ maxHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-white">Live Interview</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Question {Math.min(questionNum, maxQuestions)} of {maxQuestions}
          </div>
        </div>
        <button
          onClick={handleEndInterview}
          disabled={processing && phase === "interview"}
          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium px-4 py-2 rounded-xl transition-all"
        >
          <X className="w-3.5 h-3.5" /> End Interview
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-slate-800 flex-shrink-0">
        <div
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Transcript - scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === "assistant" ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-700 text-slate-300"
            }`}>
              {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              msg.role === "assistant"
                ? "bg-slate-800 text-slate-100 rounded-tl-sm"
                : "bg-indigo-600/20 text-indigo-100 border border-indigo-500/20 rounded-tr-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Interim text while listening */}
        {interimText && (
          <div className="flex gap-3 flex-row-reverse">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-700 text-slate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-slate-800/50 text-slate-400 border border-dashed border-slate-600 italic">
              {interimText}...
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {status === "processing" && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-indigo-500/20 text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-800 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Bottom controls */}
      <div className="flex-shrink-0 border-t border-slate-800 px-4 py-6">
        {/* Status label */}
        <div className="text-center mb-4">
          <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
        </div>

        {/* Voice wave bars when listening or speaking */}
        {(status === "listening" || status === "speaking") && (
          <div className="flex justify-center items-center gap-1 mb-4 h-6">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full ${status === "listening" ? "bg-red-400" : "bg-indigo-400"}`}
                style={{
                  height: `${Math.random() * 20 + 8}px`,
                  animation: "voice-wave 0.8s ease-in-out infinite",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Mic button */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Ripple effect when listening */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                <div className="absolute inset-0 scale-150 rounded-full bg-red-500/10 animate-ping" style={{ animationDelay: "0.3s" }} />
              </>
            )}

            <button
              onClick={toggleMic}
              disabled={status === "processing"}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${cfg.bg}`}
            >
              {isListening ? (
                <Square className="w-7 h-7 fill-current" />
              ) : status === "speaking" ? (
                <Volume2 className="w-7 h-7" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}