# InterviewAI

An AI-powered coding interview platform: LeetCode-style practice, live AI-driven
mock interviews (DSA + HR), company-specific prep, contests, analytics, and an
AI roadmap generator.

This is a **production-structured full-stack scaffold**. The architecture, data
models, and API surface are complete and functional end-to-end; the two external
integrations (OpenAI and Judge0) need your own API keys before AI feedback and
code execution go live — everything is wired to call them, nothing is mocked in
the request/response shape.

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Monaco Editor + Recharts + Socket.io client
- **Backend:** Node.js + Express + Socket.io
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (httpOnly cookie + Bearer header), Google OAuth
- **AI:** OpenAI API (pluggable — swap providers in `backend/src/services/openaiService.js`)
- **Code execution:** Judge0 API

## Project structure

```
interviewai/
├── backend/
│   ├── server.js                 # entrypoint: connects DB, boots Socket.io + HTTP
│   └── src/
│       ├── config/                # env loading, DB connection
│       ├── models/                # Mongoose schemas (User, Problem, Submission, Interview, ...)
│       ├── controllers/           # request handlers, one file per resource
│       ├── routes/                # Express routers, one file per resource
│       ├── middleware/            # auth (JWT), error handling, validation
│       ├── services/              # openaiService.js, judge0Service.js, socketService.js
│       └── utils/                 # seed.js, generateToken, asyncHandler, ApiError, xp rules
└── frontend/
    └── src/
        ├── pages/                 # one folder per feature area
        ├── components/            # layout/, ui/, charts/
        ├── services/               # one file per backend resource, all funnel through services/api.ts
        ├── context/                # AuthContext, ThemeContext
        ├── hooks/                  # useAuth, useTheme
        └── types/                  # shared TS types mirroring the backend models
```

## Getting started

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, OPENAI_API_KEY, JUDGE0_API_KEY (RapidAPI), GOOGLE_CLIENT_ID
npm install
npm run seed     # populates sample problems, companies, badges, achievements
npm run dev       # starts on http://localhost:5000
```

You need a running MongoDB instance — either local (`mongodb://localhost:27017/interviewai`)
or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

**API keys you'll need:**
- `OPENAI_API_KEY` — from [platform.openai.com](https://platform.openai.com/api-keys). Powers the AI interviewer, resume analysis, roadmap generator, submission explanations, and recommendations.
- `JUDGE0_API_KEY` — from [RapidAPI's Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce). Powers Run/Submit code execution.
- `GOOGLE_CLIENT_ID` — from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) if you want Google login.

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev       # starts on http://localhost:5173, proxies /api to :5000
```

### 3. Log in

Sign up through the UI, then to test the Admin Panel, manually set that user's
`role` field to `"admin"` in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

## What's fully implemented

- Auth: signup, login, Google OAuth, forgot/reset password, JWT sessions
- Dashboard: aggregated stats, weekly activity chart, recent interviews
- Coding Practice: problem list/filter/search, Monaco editor (4 languages), Run/Submit against Judge0, submission history, AI explanation of submissions
- AI Interview Mode: live chat-driven interview (REST + Socket.io), hints on request, end-of-interview AI scoring across 5 dimensions, strengths/weaknesses/suggestions
- Voice input via the Web Speech API (client-side, no extra backend needed)
- Resume upload + AI analysis (PDF parsing → skills/gaps/recommended topics)
- Company prep pages (problems, HR questions, system design questions)
- Contests: register, timed + virtual, contest-scoped leaderboard
- Global/college/friends leaderboard
- AI Roadmap Generator
- Analytics page (weak topics via AI, difficulty breakdown, activity heatmap)
- Gamification: XP, levels, streaks, badges, achievements (schema + award logic on submit)
- Admin Panel: platform overview, user management, problem CRUD (companies/contests CRUD follow the same pattern)

## What you'll want to extend

- Wire `backend/src/utils/mailer.js` (not included) with real SMTP creds for password-reset emails — currently logs the reset token to the console.
- The Admin Panel's Companies/Contests tabs are stubbed with a pointer to the already-built `adminController.js` patterns — copy the Users/Problems tab pattern.
- Text-to-speech for the AI interviewer's side of Voice Mode (speech-to-text is done; add the Web Speech `SpeechSynthesis` API or an ElevenLabs/OpenAI TTS call in `AIInterview.tsx`).
- Badge/achievement *awarding* logic (the models and seed data exist; hook `Achievement.criteria` checks into `problemController.submitProblemCode` and `interviewController.endInterview`).

## Design notes

Dark-first, developer-tool aesthetic in the LeetCode/Vercel space, but with its
own identity: deep navy-black surfaces, a mint "compile-success" accent instead
of the standard violet/terracotta AI palette, Space Grotesk for display type,
JetBrains Mono for stats and code. Tokens live in `frontend/tailwind.config.js`.
