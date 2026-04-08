import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/nextgen.db');

let db = null;

/* ── helpers re-exported for controllers ── */
export function dbRun(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

export function dbGet(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export async function connectDatabase(databasePath) {
  if (db) {
    return db;
  }

  return new Promise((resolve, reject) => {
    try {
      const finalPath = databasePath || dbPath;

      db = new sqlite3.Database(finalPath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            reject(err);
            return;
          }

          console.log(`Connected to SQLite database: ${finalPath}`);

          initializeTables()
            .then(() => resolve(db))
            .catch(reject);
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function initializeTables() {
  if (!db) return;

  const run = (sql) => new Promise((resolve, reject) => {
    db.run(sql, (err) => (err ? reject(err) : resolve()));
  });

  /* ── Core users table ── */
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      biography TEXT,
      avatar_color TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* ── Influencer-specific profile ── */
  await run(`
    CREATE TABLE IF NOT EXISTS influencer_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      category TEXT,
      niche TEXT,
      instagram_handle TEXT,
      instagram_followers INTEGER DEFAULT 0,
      instagram_engagement REAL DEFAULT 0,
      tiktok_handle TEXT,
      tiktok_followers INTEGER DEFAULT 0,
      tiktok_avg_views INTEGER DEFAULT 0,
      youtube_handle TEXT,
      youtube_subscribers INTEGER DEFAULT 0,
      youtube_avg_views INTEGER DEFAULT 0,
      audience_age_range TEXT,
      audience_location TEXT,
      min_rate INTEGER DEFAULT 0,
      max_rate INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* ── Brand-specific profile ── */
  await run(`
    CREATE TABLE IF NOT EXISTS brand_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT,
      industry TEXT,
      website TEXT,
      product_type TEXT,
      target_audience TEXT,
      campaign_goals TEXT,
      min_budget INTEGER DEFAULT 0,
      max_budget INTEGER DEFAULT 0,
      preferred_platforms TEXT,
      preferred_categories TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* ── Collaboration requests ── */
  await run(`
    CREATE TABLE IF NOT EXISTS collaboration_requests (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      campaign_title TEXT,
      budget_offered INTEGER,
      tenure_days INTEGER,
      tenure_value INTEGER,
      tenure_unit TEXT,
      accepted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const collabColumns = await dbAll(db, "PRAGMA table_info(collaboration_requests)");
  const hasTenureDays = collabColumns.some((column) => column.name === 'tenure_days');
  if (!hasTenureDays) {
    await run('ALTER TABLE collaboration_requests ADD COLUMN tenure_days INTEGER');
  }
  const hasTenureValue = collabColumns.some((column) => column.name === 'tenure_value');
  if (!hasTenureValue) {
    await run('ALTER TABLE collaboration_requests ADD COLUMN tenure_value INTEGER');
  }
  const hasTenureUnit = collabColumns.some((column) => column.name === 'tenure_unit');
  if (!hasTenureUnit) {
    await run('ALTER TABLE collaboration_requests ADD COLUMN tenure_unit TEXT');
  }
  const hasAcceptedAt = collabColumns.some((column) => column.name === 'accepted_at');
  if (!hasAcceptedAt) {
    await run('ALTER TABLE collaboration_requests ADD COLUMN accepted_at DATETIME');
  }

  /* ── Campaigns / portfolio items ── */
  await run(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      platform TEXT,
      results_summary TEXT,
      reach INTEGER DEFAULT 0,
      engagement INTEGER DEFAULT 0,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* ── Ratings & reviews ── */
  await run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reviewee_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      collab_request_id TEXT REFERENCES collaboration_requests(id),
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* ── Notifications ── */
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      related_id TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* ── Negotiation messages (counter-offer history) ── */
  await run(`
    CREATE TABLE IF NOT EXISTS negotiation_messages (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES collaboration_requests(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT,
      proposed_budget INTEGER DEFAULT 0,
      proposed_tenure_value INTEGER,
      proposed_tenure_unit TEXT,
      action TEXT NOT NULL DEFAULT 'counter',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* ── Migrate: add tenure columns to negotiation_messages if missing ── */
  try {
    await run(`ALTER TABLE negotiation_messages ADD COLUMN proposed_tenure_value INTEGER`);
  } catch { /* column already exists */ }
  try {
    await run(`ALTER TABLE negotiation_messages ADD COLUMN proposed_tenure_unit TEXT`);
  } catch { /* column already exists */ }

  /* ── Admin accounts ── */
  await run(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables initialized');
}

export function getDb() {
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) console.error('Error closing database:', err);
      db = null;
    });
  }
}
