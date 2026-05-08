import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { interviewService } from "../services/interviewService";
import toast from "react-hot-toast";
import { Mic, ArrowLeft, Play } from "lucide-react";
import { Link } from "react-router-dom";

const ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "Data Scientist", "ML Engineer",
  "DevOps Engineer", "Product Manager", "UX Designer", "Data Analyst",
];

export default function SetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    jobRole: "",
    customRole: "",
    difficulty: "intermediate",
    interviewType: "mixed",
    maxQuestions: 8,
  });

  const finalRole = config.jobRole === "custom" ? config.customRole : config.jobRole;

  const handleStart = async () => {
    if (!finalRole.trim()) return toast.error("Please select or enter a job role");
    setLoading(true);
    try {
      const { data } = await interviewService.start({
        jobRole: finalRole,
        difficulty: config.difficulty,
        interviewType: config.interviewType,
        maxQuestions: config.maxQuestions,
      });
      navigate(`/interview/${data.sessionId}`, { state: { firstMessage: data.message } });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Setup Interview</h1>
            <p className="text-slate-400 text-sm">Configure your AI mock interview</p>
          </div>
        </div>

        <div className="card p-6 space-y-6">
          {/* Job Role */}
          <div>
            <label className="label">Job Role</label>
            <select
              className="input mb-3"
              value={config.jobRole}
              onChange={(e) => setConfig({ ...config, jobRole: e.target.value })}
            >
              <option value="">Select a role...</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="custom">Other (custom role)</option>
            </select>
            {config.jobRole === "custom" && (
              <input
                type="text"
                className="input"
                placeholder="Enter your job role..."
                value={config.customRole}
                onChange={(e) => setConfig({ ...config, customRole: e.target.value })}
              />
            )}
          </div>

          {/* Difficulty */}
          <div>
            <label className="label">Difficulty Level</label>
            <div className="grid grid-cols-3 gap-3">
              {["beginner", "intermediate", "advanced"].map((d) => (
                <button
                  key={d}
                  onClick={() => setConfig({ ...config, difficulty: d })}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium capitalize transition-all ${
                    config.difficulty === d
                      ? "bg-brand-500/20 border-brand-500/50 text-brand-400"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Type */}
          <div>
            <label className="label">Interview Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "technical", label: "Technical", desc: "Coding & systems" },
                { value: "behavioral", label: "Behavioral", desc: "STAR method" },
                { value: "mixed", label: "Mixed", desc: "Both types" },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setConfig({ ...config, interviewType: t.value })}
                  className={`py-3 px-4 rounded-xl border text-sm transition-all text-left ${
                    config.interviewType === t.value
                      ? "bg-brand-500/20 border-brand-500/50 text-brand-400"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Questions Count */}
          <div>
            <label className="label">Number of Questions: <span className="text-brand-400">{config.maxQuestions}</span></label>
            <input
              type="range"
              min="3"
              max="15"
              value={config.maxQuestions}
              onChange={(e) => setConfig({ ...config, maxQuestions: Number(e.target.value) })}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>3 (Quick)</span>
              <span>15 (Full)</span>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={loading || !finalRole.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
}