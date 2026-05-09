const mongoose = require("mongoose");

const exchangeSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobRole: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
    interviewType: { type: String, enum: ["technical", "behavioral", "mixed"], default: "mixed" },
    status: { type: String, enum: ["active", "completed", "abandoned"], default: "active" },
    transcript: [exchangeSchema],
    questionCount: { type: Number, default: 0 },
    maxQuestions: { type: Number, default: 10 },
    userResponseCount: { type: Number, default: 0 }, // ← real answers only
    feedback: {
      overallScore: Number,
      communicationScore: Number,
      technicalScore: Number,
      behavioralScore: Number,
      strengths: [String],
      improvements: [String],
      summary: String,
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    durationMinutes: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);