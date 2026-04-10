/**
 * Seed an admin account into the database.
 *
 * Usage (from server/):
 *   node seed-admin.mjs [username] [password]
 *
 * Defaults: admin / admin123
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

async function seed() {
  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin "${username}" already exists (id: ${existing.id}). Skipping.`);
    process.exit(0);
  }

  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(password, 10);

  await prisma.admin.create({
    data: { id, username, passwordHash: hash, role: 'admin' },
  });

  console.log(`Admin seeded successfully!`);
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);
  await prisma.$disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
