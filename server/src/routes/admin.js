import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getDb, dbRun, dbGet, dbAll } from '../lib/database.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

/* ───── Auth ───── */

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const db = getDb();
    const admin = await dbGet(db, 'SELECT * FROM admins WHERE username = ?', [username]);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
  } catch (err) { next(err); }
});

router.get('/me', adminAuth, (req, res) => {
  res.json({ admin: req.admin });
});

/* ───── Dashboard Stats ───── */

router.get('/stats', adminAuth, async (_req, res, next) => {
  try {
    const db = getDb();

    const totalUsers = await dbGet(db, 'SELECT COUNT(*) AS count FROM users');
    const influencers = await dbGet(db, "SELECT COUNT(*) AS count FROM users WHERE role = 'influencer'");
    const brands = await dbGet(db, "SELECT COUNT(*) AS count FROM users WHERE role = 'brand'");
    const totalCollabs = await dbGet(db, 'SELECT COUNT(*) AS count FROM collaboration_requests');
    const pendingCollabs = await dbGet(db, "SELECT COUNT(*) AS count FROM collaboration_requests WHERE status = 'pending'");
    const acceptedCollabs = await dbGet(db, "SELECT COUNT(*) AS count FROM collaboration_requests WHERE status = 'accepted'");
    const totalNotifications = await dbGet(db, 'SELECT COUNT(*) AS count FROM notifications');

    /* recent users (last week) */
    const recentUsers = await dbGet(db,
      "SELECT COUNT(*) AS count FROM users WHERE created_at >= datetime('now', '-7 days')");

    res.json({
      totalUsers: totalUsers.count,
      influencers: influencers.count,
      brands: brands.count,
      totalCollabs: totalCollabs.count,
      pendingCollabs: pendingCollabs.count,
      acceptedCollabs: acceptedCollabs.count,
      totalNotifications: totalNotifications.count,
      recentUsers: recentUsers.count,
    });
  } catch (err) { next(err); }
});

/* ───── Users ───── */

router.get('/users', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = '';
    let params = [];
    if (search) {
      where = "WHERE username LIKE ? OR display_name LIKE ? OR email LIKE ?";
      const s = `%${search}%`;
      params = [s, s, s];
    }

    const total = await dbGet(db, `SELECT COUNT(*) AS count FROM users ${where}`, params);
    const users = await dbAll(db,
      `SELECT id, username, display_name, email, role, avatar_color, location, created_at
       FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    res.json({ users, total: total.count, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.put('/users/:id', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const { display_name, email, role } = req.body;
    await dbRun(db,
      'UPDATE users SET display_name = ?, email = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [display_name, email, role, req.params.id]
    );
    res.json({ message: 'User updated' });
  } catch (err) { next(err); }
});

router.delete('/users/:id', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    await dbRun(db, 'DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
});

/* ───── Collaborations ───── */

router.get('/collaborations', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20, status = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = '';
    let params = [];
    if (status) {
      where = 'WHERE cr.status = ?';
      params = [status];
    }

    const total = await dbGet(db,
      `SELECT COUNT(*) AS count FROM collaboration_requests cr ${where}`, params);

    const collabs = await dbAll(db,
      `SELECT cr.*, s.display_name AS sender_name, r.display_name AS receiver_name
       FROM collaboration_requests cr
       LEFT JOIN users s ON s.id = cr.sender_id
       LEFT JOIN users r ON r.id = cr.receiver_id
       ${where} ORDER BY cr.created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    res.json({ collabs, total: total.count, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.put('/collaborations/:id', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const { status } = req.body;
    await dbRun(db,
      'UPDATE collaboration_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, req.params.id]
    );
    res.json({ message: 'Collaboration updated' });
  } catch (err) { next(err); }
});

router.delete('/collaborations/:id', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    await dbRun(db, 'DELETE FROM collaboration_requests WHERE id = ?', [req.params.id]);
    res.json({ message: 'Collaboration deleted' });
  } catch (err) { next(err); }
});

/* ───── Connections (accepted collabs) ───── */

router.get('/connections', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const total = await dbGet(db,
      "SELECT COUNT(*) AS count FROM collaboration_requests WHERE status = 'accepted'");

    const connections = await dbAll(db,
      `SELECT cr.*, s.display_name AS sender_name, r.display_name AS receiver_name
       FROM collaboration_requests cr
       LEFT JOIN users s ON s.id = cr.sender_id
       LEFT JOIN users r ON r.id = cr.receiver_id
       WHERE cr.status = 'accepted'
       ORDER BY cr.accepted_at DESC, cr.updated_at DESC
       LIMIT ? OFFSET ?`,
      [Number(limit), offset]
    );

    res.json({ connections, total: total.count, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.delete('/connections/:id', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    await dbRun(db, 'DELETE FROM collaboration_requests WHERE id = ?', [req.params.id]);
    res.json({ message: 'Connection deleted' });
  } catch (err) { next(err); }
});

/* ───── Categories ───── */

router.get('/categories', adminAuth, async (_req, res, next) => {
  try {
    const db = getDb();
    const rows = await dbAll(db,
      `SELECT ip.category, COUNT(*) AS user_count
       FROM influencer_profiles ip
       WHERE ip.category IS NOT NULL AND ip.category != ''
       GROUP BY ip.category ORDER BY user_count DESC`
    );
    res.json({ categories: rows });
  } catch (err) { next(err); }
});

/* ───── Notifications ───── */

router.get('/notifications', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const total = await dbGet(db, 'SELECT COUNT(*) AS count FROM notifications');
    const notifications = await dbAll(db,
      `SELECT n.*, u.display_name AS user_name
       FROM notifications n LEFT JOIN users u ON u.id = n.user_id
       ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      [Number(limit), offset]
    );

    res.json({ notifications, total: total.count, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

router.post('/notifications/broadcast', adminAuth, async (req, res, next) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const db = getDb();
    const users = await dbAll(db, 'SELECT id FROM users');

    for (const user of users) {
      const id = crypto.randomUUID();
      await dbRun(db,
        'INSERT INTO notifications (id, user_id, type, title, body, is_read) VALUES (?, ?, ?, ?, ?, 0)',
        [id, user.id, 'admin_broadcast', title, body || '']
      );
    }

    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (err) { next(err); }
});

router.delete('/notifications/:id', adminAuth, async (req, res, next) => {
  try {
    const db = getDb();
    await dbRun(db, 'DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ message: 'Notification deleted' });
  } catch (err) { next(err); }
});

/* ───── Reports ───── */

router.get('/reports/growth', adminAuth, async (_req, res, next) => {
  try {
    const db = getDb();
    const rows = await dbAll(db,
      `SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
       FROM users GROUP BY month ORDER BY month DESC LIMIT 12`
    );
    res.json({ growth: rows.reverse() });
  } catch (err) { next(err); }
});

router.get('/reports/top-niches', adminAuth, async (_req, res, next) => {
  try {
    const db = getDb();
    const rows = await dbAll(db,
      `SELECT niche, COUNT(*) AS count FROM influencer_profiles
       WHERE niche IS NOT NULL AND niche != ''
       GROUP BY niche ORDER BY count DESC LIMIT 10`
    );
    res.json({ niches: rows });
  } catch (err) { next(err); }
});

router.get('/reports/active-users', adminAuth, async (_req, res, next) => {
  try {
    const db = getDb();
    const rows = await dbAll(db,
      `SELECT u.id, u.display_name, u.role, COUNT(cr.id) AS collab_count
       FROM users u LEFT JOIN collaboration_requests cr
       ON u.id = cr.sender_id OR u.id = cr.receiver_id
       GROUP BY u.id ORDER BY collab_count DESC LIMIT 20`
    );
    res.json({ users: rows });
  } catch (err) { next(err); }
});

/* ───── Settings ───── */

router.put('/settings/password', adminAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const db = getDb();
    const admin = await dbGet(db, 'SELECT * FROM admins WHERE id = ?', [req.adminId]);
    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await dbRun(db, 'UPDATE admins SET password_hash = ? WHERE id = ?', [hash, admin.id]);
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

export default router;
