const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const initSocket = require('./src/services/socketService');
const { PORT, NODE_ENV } = require('./src/config/env');

async function start() {
  await connectDB();

  // If running in-memory, seed database automatically
  if (global.mongoServer) {
    console.log('[server] In-memory database detected. Seeding data automatically...');
    try {
      const { seedData } = require('./src/utils/seed');
      await seedData();
    } catch (err) {
      console.error('[server] Automatic seeding failed:', err);
    }
  }

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[server] InterviewAI API running in ${NODE_ENV} mode on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('unhandledRejection', (err) => {
    console.error('[server] Unhandled rejection:', err);
    httpServer.close(() => process.exit(1));
  });
}

start();
