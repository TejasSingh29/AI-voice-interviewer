const openai = require("../config/openai");
const Session = require("../models/Session");
const User = require("../models/User");

// ─── System Prompt Builder ────────────────────────────────────────────────
const buildSystemPrompt = (jobRole, difficulty, interviewType, questionCount, maxQuestions) => {
  const difficultyMap = {
    beginner: "entry-level, straightforward",
    intermediate: "mid-level, moderately challenging",
    advanced: "senior-level, deeply technical and complex",
  };

  const typeInstructions = {
    technical: "Focus exclusively on technical skills, coding concepts, system design, and problem-solving.",
    behavioral: "Focus on STAR-method behavioral questions about past experiences, teamwork, and leadership.",
    mixed: "Alternate between technical questions and behavioral/situational questions.",
  };

  return `You are an expert technical interviewer conducting a ${difficultyMap[difficulty]} interview for a ${jobRole} position.

Interview type: ${typeInstructions[interviewType]}

Rules:
1. Ask ONE focused question at a time. Never ask multiple questions in one message.
2. Listen carefully to answers. Follow up if an answer is vague or incomplete.
3. Acknowledge the candidate's answer briefly before asking the next question. Do NOT say "Great answer!" repeatedly — vary your acknowledgments.
4. Keep your responses concise (2-4 sentences max for acknowledgment + next question).
5. Adapt question difficulty based on how well the candidate is performing.
6. Do NOT reveal scores or evaluation mid-interview.
7. This is question ${questionCount + 1} of ${maxQuestions}. ${questionCount >= maxQuestions - 1 ? "This is the LAST question. After their answer, say: 'Thank you, that concludes our interview. Please click End Interview for your feedback.'" : ""}
8. Sound natural and conversational — like a real interviewer, not a robot.`;
};

// ─── POST /api/interview/start ────────────────────────────────────────────
const startInterview = async (req, res, next) => {
  try {
    const { jobRole, difficulty = "intermediate", interviewType = "mixed", maxQuestions = 10 } = req.body;

    if (!jobRole) {
      return res.status(400).json({ error: "jobRole is required" });
    }

    // Create session
    const session = await Session.create({
      user: req.user._id,
      jobRole,
      difficulty,
      interviewType,
      maxQuestions,
      transcript: [],
    });

    // Update user's sessions
    await User.findByIdAndUpdate(req.user._id, {
      $push: { sessions: session._id },
    });

    // Generate opening question
    const systemPrompt = buildSystemPrompt(jobRole, difficulty, interviewType, 0, maxQuestions);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Start the interview. Greet the candidate warmly and ask your first ${interviewType} question for the ${jobRole} role.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiMessage = completion.choices[0].message.content;

    // Save to transcript
    session.transcript.push({ role: "assistant", content: aiMessage });
    session.questionCount = 1;
    await session.save();

    res.status(201).json({
      sessionId: session._id,
      message: aiMessage,
      questionNumber: 1,
      maxQuestions,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/interview/respond ─────────────────────────────────────────
const respondToInterview = async (req, res, next) => {
  try {
    const { sessionId, userMessage } = req.body;

    if (!sessionId || !userMessage) {
      return res.status(400).json({ error: "sessionId and userMessage are required" });
    }

    const session = await Session.findOne({ _id: sessionId, user: req.user._id });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ error: "Session is not active" });
    }

    // Add user message to transcript
    session.transcript.push({ role: "user", content: userMessage });

    // Build messages array for OpenAI (full conversation history)
    const systemPrompt = buildSystemPrompt(
      session.jobRole,
      session.difficulty,
      session.interviewType,
      session.questionCount,
      session.maxQuestions
    );

    const messages = [
      { role: "system", content: systemPrompt },
      ...session.transcript.map((t) => ({ role: t.role, content: t.content })),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 400,
    });

    const aiMessage = completion.choices[0].message.content;

    // Save AI response to transcript
    session.transcript.push({ role: "assistant", content: aiMessage });
    session.questionCount += 1;
    await session.save();

    const isComplete = session.questionCount >= session.maxQuestions;

    res.json({
      message: aiMessage,
      questionNumber: session.questionCount,
      maxQuestions: session.maxQuestions,
      isComplete,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/interview/end ──────────────────────────────────────────────
const endInterview = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = await Session.findOne({ _id: sessionId, user: req.user._id });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Generate comprehensive feedback
    const transcriptText = session.transcript
      .map((t) => `${t.role === "user" ? "Candidate" : "Interviewer"}: ${t.content}`)
      .join("\n\n");

    const feedbackCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert interview coach. Analyze this interview transcript and provide structured feedback. 
          Return your response as a valid JSON object with this exact structure:
          {
            "overallScore": <number 0-100>,
            "communicationScore": <number 0-100>,
            "technicalScore": <number 0-100>,
            "behavioralScore": <number 0-100>,
            "strengths": [<string>, <string>, <string>],
            "improvements": [<string>, <string>, <string>],
            "summary": "<2-3 sentence overall summary>"
          }
          Be honest, specific, and constructive.`,
        },
        {
          role: "user",
          content: `Analyze this ${session.jobRole} interview (${session.difficulty} level, ${session.interviewType} type):\n\n${transcriptText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    let feedback;
    try {
      const raw = feedbackCompletion.choices[0].message.content;
      const cleaned = raw.replace(/```json|```/g, "").trim();
      feedback = JSON.parse(cleaned);
    } catch {
      feedback = {
        overallScore: 70,
        communicationScore: 70,
        technicalScore: 70,
        behavioralScore: 70,
        strengths: ["Completed the interview", "Engaged with questions"],
        improvements: ["Practice more specific examples"],
        summary: "Interview completed. Detailed analysis unavailable.",
      };
    }

    // Update session
    const endedAt = new Date();
    const durationMinutes = Math.round((endedAt - session.startedAt) / 60000);

    session.status = "completed";
    session.feedback = feedback;
    session.endedAt = endedAt;
    session.durationMinutes = durationMinutes;
    await session.save();

    res.json({ feedback, durationMinutes, totalQuestions: session.questionCount });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/interview/sessions ─────────────────────────────────────────
const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id })
      .select("-transcript")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ sessions });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/interview/sessions/:id ─────────────────────────────────────
const getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({ session });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startInterview,
  respondToInterview,
  endInterview,
  getSessions,
  getSessionById,
};