# 🎙️ AI Voice Interviewer

A full-stack AI-powered voice interview system. Users speak naturally, the AI listens, generates smart interview questions/feedback, and responds with voice.

## 🏗️ Architecture

```
Frontend (React + Vite)
   ↓ (voice input via Web Speech API / Whisper)
Backend (Node + Express)
   ↓
Groq API (LLaMA 3.3-70B) (generate question/feedback)
   ↓
ElevenLabs TTS / Browser speechSynthesis
   ↓
MongoDB (persist sessions + transcripts)
```

## 🚀 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| STT | Web Speech API (free) / OpenAI Whisper API |
| AI Brain | Groq API (LLaMA 3.3-70B) |
| TTS | ElevenLabs API / Browser speechSynthesis |
| Database | MongoDB + Mongoose |
| Auth | JWT |

## 📁 Project Structure

```
ai-voice-interviewer/
├── backend/
│   ├── config/          # DB + env config
│   ├── controllers/     # Route logic
│   ├── middleware/      # Auth, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API calls
│   │   ├── pages/       # Route pages
│   │   └── context/     # Global state
│   ├── index.html
│   └── package.json
└── README.md
```

## ⚙️ Setup & Installation

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ai-voice-interviewer.git
cd ai-voice-interviewer
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your API keys in .env
npm run dev
```

### 3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env
# Fill in VITE_API_URL
npm run dev
```

### 4. Environment Variables

**Backend `.env`:**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-interviewer
JWT_SECRET=your_super_secret_key
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:5000/api
VITE_USE_ELEVENLABS=true
```

## 🔑 API Keys Required

1. **GrokAPI** → https://console.groq.com/keys
2. **ElevenLabs** (optional, free tier available) → https://elevenlabs.io
3. **MongoDB** → Local or https://mongodb.com/atlas (free tier)

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/interview/start` | Start interview session |
| POST | `/api/interview/respond` | Send user answer, get AI question |
| POST | `/api/interview/end` | End session, get feedback |
| GET | `/api/interview/sessions` | Get all sessions |
| GET | `/api/interview/sessions/:id` | Get session by ID |
| POST | `/api/tts/synthesize` | Convert text to speech |

## 🎯 Features

- 🎤 Real-time voice recording with Web Speech API
- 🤖 Groq API (LLaMA 3.3-70B) powered dynamic interview questions
- 🔊 ElevenLabs voice synthesis (or browser fallback)
- 💾 Full session persistence in MongoDB
- 📊 Post-interview feedback & scoring
- 🔐 JWT authentication
- 📱 Responsive UI

## 🤝 Contributing

PRs welcome! Please follow the branch naming: `feature/your-feature-name`


## Deploy Link -- Use it to see demo 
https://ai-intervu.netlify.app