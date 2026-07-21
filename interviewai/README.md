# 🚀 InterviewAI – AI-Powered Coding Interview Preparation Platform

<p align="center">

## Build • Practice • Analyze • Improve

A production-ready AI-powered coding interview preparation platform that helps software engineering candidates prepare for technical interviews through AI-powered mock interviews, coding practice, company-specific preparation, coding contests, analytics, and personalized learning roadmaps.

<p align="center">
<img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white"/>
<img src="https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white"/>
<img src="https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white"/>
<img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white"/>
<img src="https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white"/>
<img src="https://img.shields.io/badge/Judge0-4285F4"/>
<img src="https://img.shields.io/badge/License-MIT-green"/>
</p>

</p>

---

# 📖 Overview

InterviewAI is a full-stack MERN application inspired by platforms like LeetCode, HackerRank, and Interviewing.io. It combines AI-powered mock interviews, coding practice, online code execution, company-specific preparation, analytics, contests, resume analysis, gamification, and personalized learning into one platform.

The project follows a production-style architecture with React + TypeScript frontend, Node.js + Express backend, MongoDB database, secure JWT authentication, Socket.IO for real-time communication, OpenAI integration for AI features, and Judge0 for online code execution.

---

# ✨ Highlights

- 🤖 AI-Powered Mock Interviews
- 💻 Online Coding Platform
- ⚡ Judge0 Code Execution
- 🧠 AI Roadmap Generator
- 📄 AI Resume Analysis
- 📊 Analytics Dashboard
- 🏢 Company-wise Preparation
- 🏆 Coding Contests
- 🥇 XP, Badges & Leaderboards
- 🔐 JWT Authentication + Google OAuth
- 🌙 Responsive Dark UI
- 📡 Socket.IO Real-Time Communication

---

# 🏗️ System Architecture

```text
                   React + TypeScript + Vite
                              │
                    REST APIs + Socket.IO
                              │
                  Node.js + Express Backend
                              │
      ┌──────────────┬──────────────┬──────────────┐
      │              │              │
   MongoDB       OpenAI API      Judge0 API
(Database)    AI Interviews   Code Execution
```

---

# 🛠️ Tech Stack

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Monaco Editor
- Recharts
- Socket.IO Client

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- REST APIs
- Socket.IO

## AI & External Services
- OpenAI API
- Judge0 API
- Google OAuth
- Nodemailer

---

# ✨ Features

## 🤖 AI Interview
- AI-powered technical & HR interviews
- Real-time interview chat
- AI scoring & feedback
- Voice input support
- Personalized recommendations

## 💻 Coding Practice
- Monaco editor
- Multi-language support
- Judge0 integration
- Company-wise questions
- Topic & difficulty filters
- AI explanation of submissions

## 📊 Dashboard & Analytics
- Weekly progress
- Activity heatmap
- Weak topic detection
- Submission history
- Accuracy reports
- Personalized insights

## 🏆 Coding Contests
- Live contests
- Virtual contests
- Contest leaderboards
- Performance tracking

## 🥇 Gamification
- XP System
- Levels
- Daily Streaks
- Badges
- Achievements

## 👨‍💼 Admin Panel
- User management
- Problem management
- Contest management
- Analytics overview

---

# 📂 Project Structure

```text
InterviewAI
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── utils
│   └── server.js
├── frontend
│   ├── assets
│   ├── components
│   ├── context
│   ├── hooks
│   ├── pages
│   ├── services
│   └── types
└── README.md
```

---

# 🚀 Getting Started

```bash
git clone https://github.com/prigya-goyal/InterviewAI.git
cd InterviewAI
```

## Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

## Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

# 🔑 Environment Variables

```env
MONGO_URI=
JWT_SECRET=
OPENAI_API_KEY=
GOOGLE_CLIENT_ID=
JUDGE0_API_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

# 📈 Project Statistics

| Category | Technology |
|----------|------------|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express |
| Database | MongoDB |
| Authentication | JWT + Google OAuth |
| AI | OpenAI |
| Code Execution | Judge0 |
| Real-Time | Socket.IO |

---

# 📸 Application Preview

Replace with screenshots:

- Dashboard
- Coding Practice
- AI Interview
- Analytics
- Leaderboard
- Admin Dashboard

---

# 💡 Engineering Highlights

- Production-style MERN architecture
- MVC backend design
- RESTful APIs
- Secure JWT authentication
- Google OAuth integration
- Socket.IO real-time communication
- OpenAI-powered interview assistant
- Judge0 online code execution
- Component-based frontend
- Responsive UI
- Scalable folder structure

---

# 🚀 Future Enhancements

- AI Resume Builder
- ATS Resume Checker
- Video Interviews
- Voice AI Interviewer
- Docker & Kubernetes Deployment
- CI/CD Pipeline
- Mobile Application

---

# 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

# 📜 License

Licensed under the MIT License.

---

# 👩‍💻 Author

**Prigya Goyal**

B.Tech Computer Engineering Student

- GitHub: https://github.com/prigya-goyal
- LinkedIn: *(Add your LinkedIn profile link)*

---

