import jwt from 'jsonwebtoken';
import { getPrisma } from '../lib/prisma.js';

export default async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authorization token' });
  }

  const token = authHeader.substring('Bearer '.length);

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('Missing JWT secret');
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const prisma = getPrisma();
    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true },
    });

    if (!admin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.adminId = admin.id;
    req.admin = admin;
    next();
  } catch (error) {
    next({ status: 401, message: 'Invalid or expired token' });
  }
}
