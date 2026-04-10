import dotenv from 'dotenv';
import app from './server.js';
import { connectPrismaIfConfigured, disconnectPrisma } from './lib/prisma.js';

dotenv.config();

const {
  PORT = 5000,
} = process.env;

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set in environment variables');
  process.exit(1);
}

try {
  await connectPrismaIfConfigured();
} catch (error) {
  console.error('Failed to connect to PostgreSQL:', error.message);
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`API ready on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set a different PORT in .env`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, async () => {
    console.log(`${signal} received, closing server...`);
    server.close(async () => {
      await disconnectPrisma();
      process.exit(0);
    });
  });
}
