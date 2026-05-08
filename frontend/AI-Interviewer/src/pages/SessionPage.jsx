import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { interviewService } from "../services/interviewService";
import FeedbackCard from "../components/FeedbackCard";
import { ArrowLeft, Bot, User, Clock, BarChart2 } from "lucide-react";

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("transcript"); // 'transcript' | 'feedback'

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await interviewService.getSession(sessionId);
        setSession(data.session);
        if (data.session.feedback) setTab("feedback");
      } catch {
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const statusColors = {
    completed: "text-green-400 bg-green-400/10 border-green-400/20",
    active: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    abandoned: "text-slate-400 bg-slate-400/10 border-slate-400/20",
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">{session.jobRole}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
              <Clock className="w-3 h-3" />
              {new Date(session.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
              <span>•</span>
              <span className="capitalize">{session.difficulty}</span>
              <span>•</span>
              <span className="capitalize">{session.interviewType}</span>
              <span>•</span>
              <span className={`px-1.5 py-0.5 rounded border text-xs capitalize ${statusColors[session.status]}`}>
                {session.status}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-900 rounded-xl p-1 mb-6">
          {[
            { key: "transcript", label: "Transcript" },
            ...(session.feedback ? [{ key: "feedback", label: "Feedback" }] : []),
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? "bg-slate-700 text-slate-100"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Transcript Tab */}
        {tab === "transcript" && (
          <div className="space-y-4">
            {session.transcript.length === 0 ? (
              <div className="card p-8 text-center text-slate-500 text-sm">
                No transcript available.
              </div>
            ) : (
              session.transcript.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                    ${msg.role === "assistant" ? "bg-brand-500/20 text-brand-400" : "bg-slate-700 text-slate-300"}`}>
                    {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                    ${msg.role === "assistant"
                      ? "bg-slate-800 text-slate-100 rounded-tl-sm"
                      : "bg-brand-500/20 text-brand-100 border border-brand-500/20 rounded-tr-sm"
                    }`}>
                    {msg.content}
                    <div className="text-xs opacity-40 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {tab === "feedback" && session.feedback && (
          <FeedbackCard
            feedback={session.feedback}
            duration={session.durationMinutes}
            totalQuestions={session.questionCount}
          />
        )}

        {/* No feedback yet */}
        {tab === "feedback" && !session.feedback && (
          <div className="card p-8 text-center text-slate-500">
            <BarChart2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No feedback available. Complete the interview to get feedback.</p>
          </div>
        )}
      </div>
    </div>
  );
}