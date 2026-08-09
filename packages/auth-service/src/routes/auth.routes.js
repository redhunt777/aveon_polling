const express = require('express');
const Joi = require('joi');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate, adminOnly } = require('../middleware/auth.middleware');
const { BadRequestError } = require('@aveon/shared');

// ── Validation helper ─────────────────────────────────────
const validate = (schema) => (req, _res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return next(new BadRequestError(error.details.map(d => d.message).join('; ')));
  next();
};

// ── Schemas ───────────────────────────────────────────────
const inviteSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  membershipId: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('admin', 'member').default('member'),
});

const registerSchema = Joi.object({
  token: Joi.string().uuid().required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match' }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  userId: Joi.string().required(),
  refreshToken: Joi.string().required(),
});

// ── Routes ────────────────────────────────────────────────

// Public
router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', validate(refreshSchema), ctrl.refreshToken);

// Authenticated
router.use(authenticate);
router.post('/logout', ctrl.logout);
router.get('/me', ctrl.getMe);

// Admin only
router.use(adminOnly);
router.post('/invite', validate(inviteSchema), ctrl.sendInvite);
router.get('/invites', ctrl.listInvites);
router.delete('/invites/:id', ctrl.cancelInvite);
router.get('/users', ctrl.listUsers);
router.patch('/users/:id/role', ctrl.updateRole);
router.patch('/users/:id/activate', ctrl.reactivateUser);
router.delete('/users/:id', ctrl.deactivateUser);

module.exports = router;
