import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPrisma } from '../lib/prisma.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

/* ───── Auth ───── */

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const prisma = getPrisma();
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ sub: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, admin: { id: admin.id, username: admin.username, role: admin.role } });
  } catch (err) { next(err); }
});

router.get('/me', adminAuth, (req, res) => {
  res.json({ admin: req.admin });
});

/* ───── Dashboard Stats ───── */

router.get('/stats', adminAuth, async (_req, res, next) => {
  try {
    const prisma = getPrisma();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, influencers, brands, totalCollaborations,
      totalConnections, pendingRequests, totalNotifications,
      newUsersWeek,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'influencer' } }),
      prisma.user.count({ where: { role: 'brand' } }),
      prisma.collaborationRequest.count(),
      prisma.collaborationRequest.count({ where: { status: 'accepted' } }),
      prisma.collaborationRequest.count({ where: { status: 'pending' } }),
      prisma.notification.count(),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    const totalCategoriesRow = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT category)::int AS count
      FROM influencer_profiles WHERE category IS NOT NULL AND category != ''
    `;

    res.json({
      totalUsers, influencers, brands, totalCollaborations,
      totalConnections, pendingRequests, activeCollabs: totalConnections,
      totalNotifications, totalCategories: Number(totalCategoriesRow[0]?.count || 0),
      newUsersWeek,
    });
  } catch (err) { next(err); }
});

/* ───── Dashboard Activity ───── */

router.get('/activity', adminAuth, async (_req, res, next) => {
  try {
    const prisma = getPrisma();

    const [recentUsers, recentCollabs] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, displayName: true, email: true, role: true, createdAt: true },
      }),
      prisma.$queryRaw`
        SELECT cr.id, cr.status, cr.created_at,
               s.display_name AS sender_name,
               r.display_name AS receiver_name
        FROM collaboration_requests cr
        LEFT JOIN users s ON s.id = cr.sender_id
        LEFT JOIN users r ON r.id = cr.receiver_id
        ORDER BY cr.created_at DESC LIMIT 5
      `,
    ]);

    res.json({ recentUsers, recentCollabs });
  } catch (err) { next(err); }
});

/* ───── Users ───── */

router.get('/users', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = search ? {
      OR: [
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, username: true, displayName: true, email: true, role: true, avatarColor: true, location: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: Number(page), limit: take });
  } catch (err) { next(err); }
});

router.put('/users/:id', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { display_name, email, role } = req.body;
    await prisma.user.update({
      where: { id: req.params.id },
      data: { displayName: display_name, email, role },
    });
    res.json({ message: 'User updated' });
  } catch (err) { next(err); }
});

router.delete('/users/:id', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
});

/* ───── Collaborations ───── */

router.get('/collaborations', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { page = 1, limit = 20, status = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where = status ? { status } : {};

    const [collabRows, total] = await Promise.all([
      prisma.$queryRawUnsafe(
        status
          ? `SELECT cr.*, s.display_name AS sender_name, r.display_name AS receiver_name FROM collaboration_requests cr LEFT JOIN users s ON s.id = cr.sender_id LEFT JOIN users r ON r.id = cr.receiver_id WHERE cr.status = $1 ORDER BY cr.created_at DESC LIMIT $2 OFFSET $3`
          : `SELECT cr.*, s.display_name AS sender_name, r.display_name AS receiver_name FROM collaboration_requests cr LEFT JOIN users s ON s.id = cr.sender_id LEFT JOIN users r ON r.id = cr.receiver_id ORDER BY cr.created_at DESC LIMIT $1 OFFSET $2`,
        ...(status ? [status, take, skip] : [take, skip])
      ),
      prisma.collaborationRequest.count({ where }),
    ]);

    res.json({ collabs: collabRows, total, page: Number(page), limit: take });
  } catch (err) { next(err); }
});

router.put('/collaborations/:id', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    await prisma.collaborationRequest.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
    });
    res.json({ message: 'Collaboration updated' });
  } catch (err) { next(err); }
});

router.delete('/collaborations/:id', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    await prisma.collaborationRequest.delete({ where: { id: req.params.id } });
    res.json({ message: 'Collaboration deleted' });
  } catch (err) { next(err); }
});

/* ───── Connections (accepted collabs) ───── */

router.get('/connections', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [connections, total] = await Promise.all([
      prisma.$queryRaw`
        SELECT cr.*, s.display_name AS sender_name, r.display_name AS receiver_name
        FROM collaboration_requests cr
        LEFT JOIN users s ON s.id = cr.sender_id
        LEFT JOIN users r ON r.id = cr.receiver_id
        WHERE cr.status = 'accepted'
        ORDER BY cr.accepted_at DESC, cr.updated_at DESC
        LIMIT ${take} OFFSET ${skip}
      `,
      prisma.collaborationRequest.count({ where: { status: 'accepted' } }),
    ]);

    res.json({ connections, total, page: Number(page), limit: take });
  } catch (err) { next(err); }
});

router.delete('/connections/:id', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    await prisma.collaborationRequest.delete({ where: { id: req.params.id } });
    res.json({ message: 'Connection deleted' });
  } catch (err) { next(err); }
});

/* ───── Categories ───── */

router.get('/categories', adminAuth, async (_req, res, next) => {
  try {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw`
      SELECT ip.category, COUNT(*)::int AS user_count
      FROM influencer_profiles ip
      WHERE ip.category IS NOT NULL AND ip.category != ''
      GROUP BY ip.category ORDER BY user_count DESC
    `;
    res.json({ categories: rows });
  } catch (err) { next(err); }
});

/* ───── Notifications ───── */

router.get('/notifications', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [notifications, total] = await Promise.all([
      prisma.$queryRaw`
        SELECT n.*, u.display_name AS user_name
        FROM notifications n LEFT JOIN users u ON u.id = n.user_id
        ORDER BY n.created_at DESC LIMIT ${take} OFFSET ${skip}
      `,
      prisma.notification.count(),
    ]);

    res.json({ notifications, total, page: Number(page), limit: take });
  } catch (err) { next(err); }
});

router.post('/notifications/broadcast', adminAuth, async (req, res, next) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const prisma = getPrisma();
    const users = await prisma.user.findMany({ select: { id: true } });

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id, type: 'admin_broadcast', title, body: body || '', isRead: false,
      })),
    });

    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (err) { next(err); }
});

router.delete('/notifications/:id', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ message: 'Notification deleted' });
  } catch (err) { next(err); }
});

/* ───── Reports ───── */

function fillDates(rows, days = 30) {
  const map = new Map(rows.map((r) => [r.date, Number(r.count)]));
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) || 0 });
  }
  return result;
}

router.get('/reports/growth', adminAuth, async (_req, res, next) => {
  try {
    const prisma = getPrisma();

    const [userGrowthRaw, collabGrowthRaw, notifGrowthRaw] = await Promise.all([
      prisma.$queryRaw`
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM users WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY date ORDER BY date
      `,
      prisma.$queryRaw`
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM collaboration_requests WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY date ORDER BY date
      `,
      prisma.$queryRaw`
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM notifications WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY date ORDER BY date
      `,
    ]);

    res.json({
      userGrowth: fillDates(userGrowthRaw),
      collabGrowth: fillDates(collabGrowthRaw),
      notifGrowth: fillDates(notifGrowthRaw),
    });
  } catch (err) { next(err); }
});

router.get('/reports/top-niches', adminAuth, async (_req, res, next) => {
  try {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw`
      SELECT niche, COUNT(*)::int AS count FROM influencer_profiles
      WHERE niche IS NOT NULL AND niche != ''
      GROUP BY niche ORDER BY count DESC LIMIT 10
    `;
    res.json({ niches: rows });
  } catch (err) { next(err); }
});

router.get('/reports/active-users', adminAuth, async (_req, res, next) => {
  try {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw`
      SELECT u.id, u.display_name, u.role, COUNT(cr.id)::int AS collab_count
      FROM users u LEFT JOIN collaboration_requests cr
      ON u.id = cr.sender_id OR u.id = cr.receiver_id
      GROUP BY u.id ORDER BY collab_count DESC LIMIT 20
    `;
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
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const prisma = getPrisma();
    const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: hash } });
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

export default router;
