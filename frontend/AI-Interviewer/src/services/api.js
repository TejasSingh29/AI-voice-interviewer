import axios from "axios";

// Hardcoded Render backend URL as fallback
// VITE_API_URL env var overrides this in local dev
const baseURL = import.meta.env.VITE_API_URL || "https://ai-voice-interviewer-gzml.onrender.com/api";

const api = axios.create({
  baseURL,
  timeout: 60000, // 60s — Render free tier can be slow to wake up
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;