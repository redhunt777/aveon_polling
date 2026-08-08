const express = require('express');
const Joi = require('joi');
const router = express.Router();
const ctrl = require('../controllers/vote.controller');
const { authenticate, adminOnly } = require('../middleware/auth.middleware');
const { BadRequestError } = require('@aveon/shared');

const validate = (schema) => (req, _res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) return next(new BadRequestError(error.details.map(d => d.message).join('; ')));
  next();
};

const castVoteSchema = Joi.object({
  pollId: Joi.string().required(),
  votes: Joi.array().items(
    Joi.object({
      positionName: Joi.string().required(),
      candidateId: Joi.string().required(),
    })
  ).min(1).required(),
});

// All routes require authentication
router.use(authenticate);

// Member routes
router.post('/', validate(castVoteSchema), ctrl.castVotes);
router.get('/status/:pollId', ctrl.getVoteStatus);
router.get('/results/:pollId', ctrl.getResults);

// Admin only — live counts
router.get('/live/:pollId', adminOnly, ctrl.getLiveCount);

module.exports = router;
