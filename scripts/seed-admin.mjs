/**
 * Seed an admin account into the database.
 *
 * Usage (from project root):
 *   cd server && node ../scripts/seed-admin.mjs [username] [password]
 *
 * Defaults: admin / admin123
 */
import { connectDatabase, getDb, dbGet, dbRun } from '../server/src/lib/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });
dotenv.config();                         // fallback to root .env

const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

async function seed() {
  await connectDatabase();
  const db = getDb();

  /* ensure admins table exists (initializeTables should have created it) */
  const existing = await dbGet(db, 'SELECT id FROM admins WHERE username = ?', [username]);
  if (existing) {
    console.log(`Admin "${username}" already exists (id: ${existing.id}). Skipping.`);
    process.exit(0);
  }

  const id = crypto.randomUUID();
  const hash = await bcrypt.hash(password, 10);

  await dbRun(db,
    'INSERT INTO admins (id, username, password_hash, role) VALUES (?, ?, ?, ?)',
    [id, username, hash, 'admin']
  );

  console.log(`Admin seeded successfully!`);
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
