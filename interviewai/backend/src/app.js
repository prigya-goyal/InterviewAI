require('express-async-errors'); // must be required before routes are defined
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { CLIENT_URL, NODE_ENV, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const problemRoutes = require('./routes/problemRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const companyRoutes = require('./routes/companyRoutes');
const contestRoutes = require('./routes/contestRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// --- Core middleware ---
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "ws://localhost:5000",
          "wss:",
          "https:",
        ],
        workerSrc: ["'self'", "blob:"],
      },
    },
  })
);

const allowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
if (NODE_ENV !== 'test') app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use(
  rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// --- Health check ---
app.get('/api/health', (req, res) => res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() }));

// --- Feature routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// --- Static assets serving for production ---
const path = require('path');
const fs = require('fs');
const distPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
