const axios = require("axios");
const OpenAI = require("openai");
const multer = require("multer");
const fs = require("fs");

const upload = multer({ dest: "uploads/", limits: { fileSize: 25 * 1024 * 1024 } });

// Groq also supports Whisper for STT — free!
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ─── POST /api/tts/synthesize ─────────────────────────────────────────────
// ElevenLabs TTS (if key provided) otherwise return error → frontend uses browser TTS
const synthesizeSpeech = async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: "text is required" });

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = voiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === "your-elevenlabs-api-key-here") {
      // No ElevenLabs key — tell frontend to use browser TTS
      return res.status(400).json({ error: "ElevenLabs not configured, use browser TTS" });
    }

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      },
      {
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        responseType: "arraybuffer",
      }
    );

    res.set({ "Content-Type": "audio/mpeg", "Content-Length": response.data.byteLength });
    res.send(Buffer.from(response.data));
  } catch (error) {
    res.status(500).json({ error: "TTS failed: " + error.message });
  }
};

// ─── POST /api/tts/transcribe ─────────────────────────────────────────────
// Groq Whisper STT — free and very fast
const transcribeAudio = async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) return res.status(400).json({ error: "Audio file is required" });
    filePath = req.file.path;

    const transcription = await groqClient.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-large-v3",
      language: "en",
      response_format: "text",
    });

    res.json({ text: transcription });
  } catch (error) {
    console.error("❌ Transcribe error:", error.message);
    res.status(500).json({ error: "Transcription failed: " + error.message });
  } finally {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
};

// ─── GET /api/tts/voices ──────────────────────────────────────────────────
const getVoices = async (req, res) => {
  res.json({
    voices: [
      { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", category: "premade" },
      { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", category: "premade" },
      { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", category: "premade" },
      { id: "ErXwobaYiN019PkySvjV", name: "Antoni", category: "premade" },
    ],
  });
};

module.exports = { synthesizeSpeech, transcribeAudio, upload, getVoices };