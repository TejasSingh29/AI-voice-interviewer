/**
 * VoiceWave - animated bar visualizer
 * active: true = listening/speaking animation
 */
export default function VoiceWave({ active = false, color = "bg-brand-400", bars = 5 }) {
  return (
    <div className="flex items-center gap-1 h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-300 ${
            active ? `${color} voice-bar` : "bg-slate-600 h-1"
          }`}
          style={{
            height: active ? undefined : "4px",
            animationDelay: active ? `${i * 0.1}s` : undefined,
            minHeight: active ? "8px" : undefined,
            maxHeight: active ? "32px" : undefined,
          }}
        />
      ))}
    </div>
  );
}