import { useEffect, useRef } from "react";
import { Bot, User } from "lucide-react";

export default function TranscriptPanel({ messages, interimText }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  return (
    <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
        >
          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm
              ${msg.role === "assistant" ? "bg-brand-500/20 text-brand-400" : "bg-slate-700 text-slate-300"}`}
          >
            {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>

          {/* Bubble */}
          <div
            className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
              ${msg.role === "assistant"
                ? "bg-slate-800 text-slate-100 rounded-tl-sm"
                : "bg-brand-500/20 text-brand-100 border border-brand-500/20 rounded-tr-sm"
              }`}
          >
            {msg.content}
          </div>
        </div>
      ))}

      {/* Interim text (browser STT real-time) */}
      {interimText && (
        <div className="flex gap-3 flex-row-reverse">
          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-slate-700 text-slate-300">
            <User className="w-4 h-4" />
          </div>
          <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-slate-800/50 text-slate-400 border border-dashed border-slate-700 italic">
            {interimText}...
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}