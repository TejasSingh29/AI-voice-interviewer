import api from "./api";

export const interviewService = {
  start: (payload) => api.post("/interview/start", payload),
  respond: (sessionId, userMessage, isTimeout = false) =>
    api.post("/interview/respond", { sessionId, userMessage, isTimeout }),
  end: (sessionId) => api.post("/interview/end", { sessionId }),
  getSessions: () => api.get("/interview/sessions"),
  getSession: (id) => api.get(`/interview/sessions/${id}`),
};

export const ttsService = {
  synthesize: async (text) => {
    const response = await api.post("/tts/synthesize", { text }, { responseType: "arraybuffer" });
    return new Blob([response.data], { type: "audio/mpeg" });
  },
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