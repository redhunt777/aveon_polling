const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Invite = require('../models/Invite');
const { getRedis } = require('../config/redis');
const { sendInviteEmail } = require('../utils/email');
const { signAccessToken, decodeToken } = require('@aveon/shared');
const {
  BadRequestError, NotFoundError, UnauthorizedError,
  ConflictError, ForbiddenError,
} = require('@aveon/shared');

const REFRESH_TTL = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800', 10); // 7 days in seconds

// ── Helper: issue token pair ──────────────────────────────
const issueTokens = async (user) => {
  const redis = getRedis();
  const payload = { sub: user._id.toString(), email: user.email, role: user.role, name: user.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = uuidv4();
  await redis.set(`refresh:${user._id}`, refreshToken, 'EX', REFRESH_TTL);
  return { accessToken, refreshToken };
};

// ────────────────────────────────────────────────────────
// POST /auth/invite  (admin only)
// ────────────────────────────────────────────────────────
const sendInvite = async (req, res, next) => {
  try {
    const { email, name, membershipId, role = 'member' } = req.body;

    // Check for existing user or pending invite
    const existingUser = await User.findOne({ $or: [{ email }, { membershipId }] });
    if (existingUser) throw new ConflictError('A user with this email or membership ID already exists');

    const existingInvite = await Invite.findOne({ email, used: false, expiresAt: { $gt: new Date() } });
    if (existingInvite) throw new ConflictError('A pending invite already exists for this email');

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    const invite = await Invite.create({
      token, email, name, membershipId, role,
      expiresAt,
      createdBy: req.user.sub,
    });

    await sendInviteEmail({ toEmail: email, toName: name, token });

    res.status(201).json({
      success: true,
      message: `Invite sent to ${email}`,
      data: { inviteId: invite._id, expiresAt },
    });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// GET /auth/invites  (admin only)
// ────────────────────────────────────────────────────────
const listInvites = async (req, res, next) => {
  try {
    const invites = await Invite.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .select('-__v');
    res.json({ success: true, data: invites });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// POST /auth/register  (public — requires invite token)
// ────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const invite = await Invite.findOne({ token });
    if (!invite) throw new BadRequestError('Invalid invite token');
    if (invite.used) throw new BadRequestError('This invite link has already been used');
    if (invite.expiresAt < new Date()) throw new BadRequestError('Invite link has expired');

    // Check again for race condition
    const existing = await User.findOne({ $or: [{ email: invite.email }, { membershipId: invite.membershipId }] });
    if (existing) throw new ConflictError('Account already exists');

    const user = await User.create({
      name: invite.name,
      email: invite.email,
      membershipId: invite.membershipId,
      role: invite.role,
      passwordHash: password, // pre-save hook hashes this
    });

    // Mark invite as used
    invite.used = true;
    await invite.save();

    const { accessToken, refreshToken } = await issueTokens(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: user.toSafeObject(), accessToken, refreshToken },
    });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// POST /auth/login
// ────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    if (!user.isActive) throw new ForbiddenError('Your account has been deactivated');

    const { accessToken, refreshToken } = await issueTokens(user);

    res.json({
      success: true,
      data: { user: user.toSafeObject(), accessToken, refreshToken },
    });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// POST /auth/refresh
// ────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: rt, userId } = req.body;
    if (!rt) throw new BadRequestError('Refresh token required');
    if (!userId) throw new BadRequestError('userId required alongside refreshToken');

    const redis = getRedis();
    const stored = await redis.get(`refresh:${userId}`);
    if (!stored || stored !== rt) throw new UnauthorizedError('Invalid or expired refresh token');

    const user = await User.findById(userId);
    if (!user || !user.isActive) throw new UnauthorizedError('User not found or inactive');

    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user);

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// POST /auth/logout
// ────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const redis = getRedis();
    const userId = req.user.sub;

    // Get remaining TTL from token and blacklist it
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      const decoded = decodeToken(token);
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) await redis.set(`blacklist:${token}`, '1', 'EX', ttl);
    }

    // Remove refresh token
    await redis.del(`refresh:${userId}`);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// GET /auth/me
// ────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select('-passwordHash -__v');
    if (!user) throw new NotFoundError('User not found');
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// GET /auth/users  (admin only)
// ────────────────────────────────────────────────────────
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash -__v').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// PATCH /auth/users/:id/role  (admin only)
// ────────────────────────────────────────────────────────
const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member'].includes(role)) throw new BadRequestError('Invalid role');

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, select: '-passwordHash -__v' }
    );
    if (!user) throw new NotFoundError('User not found');

    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// DELETE /auth/users/:id  (admin only)
// ────────────────────────────────────────────────────────
const deactivateUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.sub) throw new BadRequestError('Cannot deactivate yourself');

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true, select: '-passwordHash -__v' }
    );
    if (!user) throw new NotFoundError('User not found');

    // Revoke refresh token
    getRedis().del(`refresh:${req.params.id}`);

    res.json({ success: true, message: 'User deactivated', data: user });
  } catch (err) { next(err); }
};

module.exports = { sendInvite, listInvites, register, login, refreshToken, logout, getMe, listUsers, updateRole, deactivateUser };
