const express = require('express');
const Joi = require('joi');
const router = express.Router();
const ctrl = require('../controllers/poll.controller');
const { authenticate, adminOnly } = require('../middleware/auth.middleware');
const { BadRequestError } = require('@aveon/shared');

const validate = (schema) => (req, _res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return next(new BadRequestError(error.details.map(d => d.message).join('; ')));
  next();
};

const createPollSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).allow('').optional(),
  positions: Joi.array().items(
    Joi.object({
      positionName: Joi.string().required(),
      candidates: Joi.array().optional(),
    })
  ).optional(),
});

const statusSchema = Joi.object({
  status: Joi.string().valid('active', 'closed').required(),
});

const positionSchema = Joi.object({
  positionName: Joi.string().min(2).max(100).required(),
});

const candidateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  membershipId: Joi.string().required(),
  bio: Joi.string().max(500).allow('').optional(),
  photoUrl: Joi.string().uri().allow('').optional(),
});

// All routes require authentication
router.use(authenticate);

// Member routes
router.get('/', ctrl.listPolls);
router.get('/:id', ctrl.getPoll);

// Admin routes
router.use(adminOnly);
router.post('/', validate(createPollSchema), ctrl.createPoll);
router.patch('/:id/status', validate(statusSchema), ctrl.updateStatus);
router.post('/:id/positions', validate(positionSchema), ctrl.addPosition);
router.post('/:id/positions/:positionName/candidates', validate(candidateSchema), ctrl.addCandidate);
router.delete('/:id/positions/:positionName/candidates/:candidateId', ctrl.removeCandidate);
router.delete('/:id', ctrl.deletePoll);

module.exports = router;
