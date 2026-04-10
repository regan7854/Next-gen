import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getPrisma } from '../lib/prisma.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

/* ───── Auth ───── */

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const prisma = getPrisma();
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
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
    const prisma = getPrisma();

    const [totalUsers, influencers, brands, totalCollaborations, totalConnections, pendingRequests, totalNotifications, totalCategories, newUsersWeek] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'influencer' } }),
      prisma.user.count({ where: { role: 'brand' } }),
      prisma.collaborationRequest.count(),
      prisma.collaborationRequest.count({ where: { status: 'accepted' } }),
      prisma.collaborationRequest.count({ where: { status: 'pending' } }),
      prisma.notification.count(),
      prisma.influencerProfile.findMany({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ['category'],
      }),
      prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      }),
    ]);

    res.json({
      totalUsers,
      influencers,
      brands,
      totalCollaborations,
      totalConnections,
      pendingRequests,
      activeCollabs: totalConnections,
      totalNotifications,
      totalCategories: totalCategories.filter((c) => c.category && c.category !== '').length,
      newUsersWeek,
    });
  } catch (err) { next(err); }
});

/* ───── Dashboard Activity ───── */

router.get('/activity', adminAuth, async (_req, res, next) => {
  try {
    const prisma = getPrisma();

    const recentUsers = await prisma.user.findMany({
      select: { id: true, displayName: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentCollabs = await prisma.collaborationRequest.findMany({
      select: {
        id: true, status: true, createdAt: true,
        sender: { select: { displayName: true } },
        receiver: { select: { displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      recentUsers: recentUsers.map((u) => ({
        id: u.id, display_name: u.displayName, email: u.email, role: u.role, created_at: u.createdAt,
      })),
      recentCollabs: recentCollabs.map((c) => ({
        id: c.id, status: c.status, created_at: c.createdAt,
        sender_name: c.sender?.displayName, receiver_name: c.receiver?.displayName,
      })),
    });
  } catch (err) { next(err); }
});

/* ───── Users ───── */

router.get('/users', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { displayName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true, username: true, displayName: true, email: true,
          role: true, avatarColor: true, location: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: offset,
      }),
    ]);

    res.json({
      users: users.map((u) => ({
        id: u.id, username: u.username, display_name: u.displayName,
        email: u.email, role: u.role, avatar_color: u.avatarColor,
        location: u.location, created_at: u.createdAt,
      })),
      total, page: Number(page), limit: Number(limit),
    });
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
    const offset = (Number(page) - 1) * Number(limit);

    const where = status ? { status } : {};

    const [totalCount, collabs] = await Promise.all([
      prisma.collaborationRequest.count({ where }),
      prisma.collaborationRequest.findMany({
        where,
        include: {
          sender: { select: { displayName: true } },
          receiver: { select: { displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: offset,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / Number(limit));
    res.json({
      collaborations: collabs.map((c) => ({
        ...c, sender_name: c.sender?.displayName, receiver_name: c.receiver?.displayName,
      })),
      total: totalCount, totalPages, page: Number(page), limit: Number(limit),
    });
  } catch (err) { next(err); }
});

router.put('/collaborations/:id/status', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { status } = req.body;
    await prisma.collaborationRequest.update({
      where: { id: req.params.id },
      data: { status },
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
    const offset = (Number(page) - 1) * Number(limit);

    const where = { status: 'accepted' };

    const [total, connections] = await Promise.all([
      prisma.collaborationRequest.count({ where }),
      prisma.collaborationRequest.findMany({
        where,
        include: {
          sender: { select: { displayName: true } },
          receiver: { select: { displayName: true } },
        },
        orderBy: [{ acceptedAt: 'desc' }, { updatedAt: 'desc' }],
        take: Number(limit),
        skip: offset,
      }),
    ]);

    res.json({
      connections: connections.map((c) => ({
        ...c, sender_name: c.sender?.displayName, receiver_name: c.receiver?.displayName,
      })),
      total: total, page: Number(page), limit: Number(limit),
    });
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
      SELECT category, COUNT(*)::int AS user_count
      FROM influencer_profiles
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category ORDER BY user_count DESC
    `;
    res.json({ categories: rows });
  } catch (err) { next(err); }
});

/* ───── Notifications ───── */

router.get('/notifications', adminAuth, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [total, notifications] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.findMany({
        include: { user: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: offset,
      }),
    ]);

    res.json({
      notifications: notifications.map((n) => ({
        ...n, user_name: n.user?.displayName,
      })),
      total, page: Number(page), limit: Number(limit),
    });
  } catch (err) { next(err); }
});

router.post('/notifications/broadcast', adminAuth, async (req, res, next) => {
  try {
    const { title, body } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const prisma = getPrisma();
    const users = await prisma.user.findMany({ select: { id: true } });

    const data = users.map((user) => ({
      id: crypto.randomUUID(),
      userId: user.id,
      type: 'admin_broadcast',
      title,
      body: body || '',
      isRead: false,
    }));

    await prisma.notification.createMany({ data });

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
  const map = new Map(rows.map(r => [r.date, Number(r.count)]));
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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [userGrowthRaw, collabGrowthRaw, notifGrowthRaw] = await Promise.all([
      prisma.$queryRaw`
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM users WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY date ORDER BY date
      `,
      prisma.$queryRaw`
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM collaboration_requests WHERE created_at >= ${thirtyDaysAgo}
        GROUP BY date ORDER BY date
      `,
      prisma.$queryRaw`
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM notifications WHERE created_at >= ${thirtyDaysAgo}
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
      GROUP BY u.id, u.display_name, u.role ORDER BY collab_count DESC LIMIT 20
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
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const prisma = getPrisma();
    const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash: hash },
    });
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

export default router;
