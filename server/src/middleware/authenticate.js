import jwt from 'jsonwebtoken';

export default function authenticate(req, res, next) {
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
    req.userId = payload.sub;
    next();
  } catch (error) {
    next({ status: 401, message: 'Invalid or expired token' });
  }
}
