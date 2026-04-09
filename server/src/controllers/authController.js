import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDb, dbRun, dbGet } from '../lib/database.js';

const TOKEN_TTL_HOURS = 12;

function createToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('Missing JWT secret');
  }

  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: `${TOKEN_TTL_HOURS}h`,
  });
}

function generateAvatarColor(seed) {
  const seedValue = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = seedValue % 360;
  return `hsl(${hue} 70% 55%)`;
}

export async function registerUser(req, res, next) {
  try {
    const { username, displayName, email, password, role = 'user', biography = '' } = req.body;

    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase().trim();
    const db = getDb();

    if (!db) {
      return res.status(500).json({ message: 'Database unavailable' });
    }

    const existingEmail = await dbGet(db, 'SELECT id FROM users WHERE email = ?', [
      normalizedEmail,
    ]);

    if (existingEmail) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const existingUsername = await dbGet(db, 'SELECT id FROM users WHERE username = ?', [
      normalizedUsername,
    ]);

    if (existingUsername) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const avatarColor = generateAvatarColor(normalizedEmail);

    await dbRun(
      db,
      'INSERT INTO users (id, username, display_name, email, password_hash, role, biography, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, normalizedUsername, displayName, normalizedEmail, passwordHash, role, biography, avatarColor]
    );

    const token = createToken(userId);

    res.status(201).json({
      token,
      user: {
        id: userId,
        username: normalizedUsername,
        displayName,
        email: normalizedEmail,
        role,
        biography,
        avatarColor,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req, res, next) {
  try {
    const { identifier, password } = req.body;
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const db = getDb();

    if (!db) {
      return res.status(500).json({ message: 'Database unavailable' });
    }

    const isEmail = normalizedIdentifier.includes('@');
    const user = await dbGet(
      db,
      `SELECT id, username, display_name, email, password_hash, role, biography, avatar_color FROM users WHERE ${isEmail ? 'email' : 'username'} = ?`,
      [normalizedIdentifier]
    );

    if (!user) {
      return res.status(401).json({ message: 'Account not found' });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    const token = createToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        biography: user.biography,
        avatarColor: user.avatar_color,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res, next) {
  try {
    const db = getDb();

    if (!db) {
      return res.status(500).json({ message: 'Database unavailable' });
    }

    const user = await dbGet(
      db,
      'SELECT id, username, display_name, email, role, biography, avatar_color, created_at, updated_at FROM users WHERE id = ?',
      [req.userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        email: user.email,
        role: user.role,
        biography: user.biography,
        avatarColor: user.avatar_color,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
}
