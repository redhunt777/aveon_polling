const { verifyToken, UnauthorizedError, ForbiddenError } = require('@aveon/shared');

const authenticate = (req, _res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) throw new UnauthorizedError('No token provided');
    req.user = verifyToken(auth.split(' ')[1]);
    next();
  } catch (err) {
    next(err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError'
      ? new UnauthorizedError('Invalid or expired token') : err);
  }
};

const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(new ForbiddenError('Admin access required'));
  next();
};

module.exports = { authenticate, adminOnly };
