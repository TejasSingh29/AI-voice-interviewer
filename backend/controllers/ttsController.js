const axios = require("axios");
const openai = require("../config/openai");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const upload = multer({ dest: "uploads/", limits: { fileSize: 25 * 1024 * 1024 } });

// ─── POST /api/tts/synthesize ─────────────────────────────────────────────
// Convert text to speech using ElevenLabs
const synthesizeSpeech = async (req, res, next) => {
  try {
    const { text, voiceId } = req.body;

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = voiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

    if (!ELEVENLABS_API_KEY) {
      return res.status(400).json({ error: "ElevenLabs API key not configured" });
    }

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
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

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": response.data.byteLength,
    });
    res.send(Buffer.from(response.data));
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(401).json({ error: "Invalid ElevenLabs API key" });
    }
    if (error.response?.status === 422) {
      return res.status(422).json({ error: "Invalid voice ID or text" });
    }
    next(error);
  }
};

// ─── POST /api/tts/transcribe ─────────────────────────────────────────────
// Convert audio to text using OpenAI Whisper
const transcribeAudio = async (req, res, next) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    filePath = req.file.path;

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "en",
      response_format: "text",
    });

    res.json({ text: transcription });
  } catch (error) {
    next(error);
  } finally {
    // Cleanup uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// ─── GET /api/tts/voices ──────────────────────────────────────────────────
// List available ElevenLabs voices
const getVoices = async (req, res, next) => {
  try {
    const response = await axios.get("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
    });

    const voices = response.data.voices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category,
      description: v.labels,
    }));

    res.json({ voices });
  } catch (error) {
    next(error);
  }
};

module.exports = { synthesizeSpeech, transcribeAudio, upload, getVoices };