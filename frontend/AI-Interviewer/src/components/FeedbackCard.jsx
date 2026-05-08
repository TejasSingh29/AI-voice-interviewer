import { CheckCircle, TrendingUp, TrendingDown, Star } from "lucide-react";

function ScoreBar({ label, score, color = "bg-brand-500" }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-slate-200">{score}/100</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function FeedbackCard({ feedback, duration, totalQuestions }) {
  if (!feedback) return null;

  const overallColor =
    feedback.overallScore >= 75 ? "text-green-400" :
    feedback.overallScore >= 50 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="card p-6 text-center">
        <div className={`text-5xl font-bold mb-1 ${overallColor}`}>
          {feedback.overallScore}
        </div>
        <div className="text-slate-400 text-sm">Overall Score</div>
        <div className="flex justify-center gap-4 mt-3 text-xs text-slate-500">
          <span>{totalQuestions} questions</span>
          <span>•</span>
          <span>{duration} min</span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="card p-6 space-y-4">
        <h3 className="font-medium text-slate-200">Score Breakdown</h3>
        <ScoreBar label="Communication" score={feedback.communicationScore} color="bg-blue-500" />
        <ScoreBar label="Technical" score={feedback.technicalScore} color="bg-purple-500" />
        <ScoreBar label="Behavioral" score={feedback.behavioralScore} color="bg-green-500" />
      </div>

      {/* Summary */}
      <div className="card p-6">
        <p className="text-slate-300 text-sm leading-relaxed">{feedback.summary}</p>
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="font-medium text-green-400 flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" /> Strengths
          </h3>
          <ul className="space-y-2">
            {feedback.strengths?.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-6">
          <h3 className="font-medium text-yellow-400 flex items-center gap-2 mb-3">
            <Star className="w-4 h-4" /> Improvements
          </h3>
          <ul className="space-y-2">
            {feedback.improvements?.map((s, i) => (
              <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                <TrendingDown className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}