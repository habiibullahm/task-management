import http from 'http';
import app from './app';
import env from './config/env';
import Database from './config/database';
import { initRealtime } from './realtime/socket';
import { MailerUtil } from './utils/mailer.util';

const PORT = env.get('PORT');

async function startServer() {
  try {
    await Database.connect();

    if (env.isProduction() && !MailerUtil.isConfigured()) {
      console.warn(
        '[mailer] SMTP_* or RESEND_API_KEY is not set — forgot-password will return 503 until configured'
      );
    }

    const server = http.createServer(app);
    initRealtime(server);

    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Task Management API Server                          ║
║                                                           ║
║   Environment: ${env.get('NODE_ENV').padEnd(42)}║
║   Port:        ${PORT.toString().padEnd(42)}║
║   API Prefix:  ${env.get('API_PREFIX').padEnd(42)}║
║   WebSocket:   /socket.io                                 ║
║                                                           ║
║   📚 API Documentation:                                   ║
║   Health Check: http://localhost:${PORT}${env.get('API_PREFIX')}/health     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `Port ${PORT} is already in use. Run "npm run free-port" then start again, or stop the other process.`
        );
        process.exit(1);
      }
      console.error('Failed to start server:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

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

startServer();
