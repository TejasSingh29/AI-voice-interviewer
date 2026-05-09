import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { interviewService } from "../services/interviewService";
import { Mic, Plus, LogOut, Clock, ChevronRight, BarChart2 } from "lucide-react";

const statusColors = {
  active: "text-yellow-400 bg-yellow-400/10",
  completed: "text-green-400 bg-green-400/10",
  abandoned: "text-slate-400 bg-slate-400/10",
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await interviewService.getSessions();
        setSessions(data.sessions);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const completed = sessions.filter((s) => s.status === "completed");
  const avgScore = completed.length
    ? Math.round(completed.reduce((a, s) => a + (s.feedback?.overallScore || 0), 0) / completed.length)
    : null;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src="/crip-logo.jpg" alt="Crip AI" className="w-9 h-9 rounded-xl object-cover" />
            <div>
              <h1 className="font-semibold text-slate-100">Crip AI</h1>
              <p className="text-xs text-slate-500">Welcome, {user?.name}</p>
            </div>
          </div>

          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Interviews", value: sessions.length },
            { label: "Completed", value: completed.length },
            { label: "Avg Score", value: avgScore != null ? `${avgScore}%` : "—" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl font-semibold text-slate-100">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Start Interview CTA */}
        <button
          onClick={() => navigate("/setup")}
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base mb-8"
        >
          <Plus className="w-5 h-5" />
          Start New Interview
        </button>

        {/* Past Sessions */}
        <div>
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
            Past Sessions
          </h2>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">
              <Mic className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No interviews yet. Start your first one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <Link
                  key={s._id}
                  to={`/session/${s._id}`}
                  className="card p-4 flex items-center justify-between hover:border-slate-700 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <BarChart2 className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-slate-200">{s.jobRole}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(s.createdAt).toLocaleDateString()}
                        <span>•</span>
                        <span className="capitalize">{s.difficulty}</span>
                        <span>•</span>
                        <span className={`capitalize px-1.5 py-0.5 rounded text-xs ${statusColors[s.status]}`}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {s.feedback?.overallScore != null && (
                      <span className="text-sm font-semibold text-brand-400">
                        {s.feedback.overallScore}%
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}