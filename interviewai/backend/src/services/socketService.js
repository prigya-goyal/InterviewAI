const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, CLIENT_URL } = require('../config/env');
const { getInterviewerTurn } = require('./openaiService');
const Interview = require('../models/Interview');

/**
 * Wires up Socket.io on top of the existing HTTP server. Used for the live,
 * turn-by-turn AI interview experience (and can be reused for live contest
 * leaderboard pushes, notifications, etc.).
 */
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: CLIENT_URL, credentials: true },
  });

  // Auth handshake — client connects with `auth: { token }`
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[socket] connected: user=${socket.userId} socket=${socket.id}`);

    // Client joins a specific interview room to receive that interview's turns
    socket.on('interview:join', ({ interviewId }) => {
      socket.join(`interview:${interviewId}`);
    });

    // Candidate sends a message (answer, code, or hint request)
    socket.on('interview:message', async ({ interviewId, message, type = 'answer' }) => {
      try {
        const interview = await Interview.findById(interviewId);
        if (!interview || String(interview.user) !== socket.userId) {
          return socket.emit('interview:error', { message: 'Interview not found' });
        }

        interview.transcript.push({ speaker: 'user', message, type });

        const aiReply = await getInterviewerTurn({
          transcript: interview.transcript,
          currentProblem: null, // populate from interview.problems[last] in a full implementation
          candidateInput: message,
          requestedHint: type === 'hint',
        });

        interview.transcript.push({ speaker: 'ai', message: aiReply, type: 'question' });
        await interview.save();

        io.to(`interview:${interviewId}`).emit('interview:message', {
          speaker: 'ai',
          message: aiReply,
        });
      } catch (err) {
        console.error('[socket] interview:message error', err);
        socket.emit('interview:error', { message: 'Failed to process interview turn' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnected: user=${socket.userId}`);
    });
  });

  return io;
}

module.exports = initSocket;
