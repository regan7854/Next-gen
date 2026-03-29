import dotenv from 'dotenv';
import app from './server.js';
import { connectDatabase, closeDatabase } from './lib/database.js';
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
  await connectDatabase();
} catch (error) {
  console.error('Failed to connect to SQLite database:', error);
  process.exit(1);
}

try {
  await connectPrismaIfConfigured();
} catch (error) {
  // Keep server alive on SQLite even if PostgreSQL is unreachable.
  console.warn('Continuing without PostgreSQL/Prisma:', error.message);
}

const server = app.listen(PORT, () => {
  console.log(`API ready on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  server.close(async () => {
    await closeDatabase();
    await disconnectPrisma();
    process.exit(0);
  });
});
