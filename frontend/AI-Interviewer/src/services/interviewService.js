import api from "./api";

export const interviewService = {
  start: (payload) => api.post("/interview/start", payload),
  respond: (sessionId, userMessage) =>
    api.post("/interview/respond", { sessionId, userMessage }),
  end: (sessionId) => api.post("/interview/end", { sessionId }),
  getSessions: () => api.get("/interview/sessions"),
  getSession: (id) => api.get(`/interview/sessions/${id}`),
};

export const ttsService = {
  // ElevenLabs TTS — returns audio blob
  synthesize: async (text) => {
    const response = await api.post(
      "/tts/synthesize",
      { text },
      { responseType: "arraybuffer" }
    );
    return new Blob([response.data], { type: "audio/mpeg" });
  },

  // Whisper STT — send audio blob, get text
  transcribe: async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    const { data } = await api.post("/tts/transcribe", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.text;
  },

  getVoices: () => api.get("/tts/voices"),
};