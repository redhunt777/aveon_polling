const { verifyToken, UnauthorizedError, ForbiddenError } = require('@aveon/shared');
const { getRedis } = require('../config/redis');

/**
 * Verify JWT from Authorization header.
 * Also checks the blacklist in Redis.
 */
const authenticate = async (req, _res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) throw new UnauthorizedError('No token provided');

    const token = auth.split(' ')[1];

    // Check blacklist
    const redis = getRedis();
    const blacklisted = await redis.get(`blacklist:${token}`);
    if (blacklisted) throw new UnauthorizedError('Token has been invalidated');

    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError'
      ? new UnauthorizedError('Invalid or expired token')
      : err);
  }
};

/**
 * Restrict access to admin role only
 */
const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(new ForbiddenError('Admin access required'));
  next();
};

module.exports = { authenticate, adminOnly };
