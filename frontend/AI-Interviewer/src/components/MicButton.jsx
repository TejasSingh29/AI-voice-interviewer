import { Mic, MicOff, Square } from "lucide-react";

export default function MicButton({ isListening, isSpeaking, onClick, disabled }) {
  const state = isListening ? "listening" : isSpeaking ? "speaking" : "idle";

  const colors = {
    idle: "bg-brand-500 hover:bg-brand-600 shadow-brand-500/30",
    listening: "bg-red-500 hover:bg-red-600 shadow-red-500/40",
    speaking: "bg-slate-600 cursor-not-allowed shadow-slate-500/20",
  };

  const labels = {
    idle: "Click to speak",
    listening: "Click to stop",
    speaking: "AI is speaking...",
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Ripple rings */}
      <div className="relative">
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500/20 ripple" />
            <div className="absolute inset-0 rounded-full bg-red-500/10 ripple" style={{ animationDelay: "0.5s" }} />
          </>
        )}
        <button
          onClick={onClick}
          disabled={disabled || isSpeaking}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center
                      text-white shadow-xl transition-all duration-200 active:scale-95
                      ${colors[state]}`}
        >
          {isListening ? (
            <Square className="w-7 h-7 fill-current" />
          ) : (
            <Mic className="w-7 h-7" />
          )}
        </button>
      </div>

      <span className="text-sm text-slate-400">{labels[state]}</span>
    </div>
  );
}