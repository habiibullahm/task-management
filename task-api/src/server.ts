import app from './app';
import env from './config/env';
import Database from './config/database';

const PORT = env.get('PORT');

async function startServer() {
  try {
    // Connect to database
    await Database.connect();

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Task Management API Server                          ║
║                                                           ║
║   Environment: ${env.get('NODE_ENV').padEnd(42)}║
║   Port:        ${PORT.toString().padEnd(42)}║
║   API Prefix:  ${env.get('API_PREFIX').padEnd(42)}║
║                                                           ║
║   📚 API Documentation:                                   ║
║   Health Check: http://localhost:${PORT}${env.get('API_PREFIX')}/health     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await Database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await Database.disconnect();
  process.exit(0);
});

// Start the server
startServer();

