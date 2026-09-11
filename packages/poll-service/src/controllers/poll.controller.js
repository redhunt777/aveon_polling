const Poll = require('../models/Poll');
const { getRedis } = require('../config/redis');
const { publishEvent } = require('../config/kafka');
const { NotFoundError, BadRequestError, ForbiddenError } = require('@aveon/shared');

const ACTIVE_POLL_TTL = 60;    // 60 seconds cache for active poll detail
const POLL_LIST_TTL = 30;      // 30 seconds cache for poll list

// ── Helpers ───────────────────────────────────────────────
const invalidatePollCache = async (pollId) => {
  const redis = getRedis();
  await redis.del(`poll:${pollId}`, 'polls:active', 'polls:all');
};

// ────────────────────────────────────────────────────────
// POST /polls  (admin)
// ────────────────────────────────────────────────────────
const createPoll = async (req, res, next) => {
  try {
    const { title, description, positions } = req.body;

    const poll = await Poll.create({
      title,
      description,
      createdBy: req.user.sub,
      positions: positions || [],
    });

    await invalidatePollCache(poll._id.toString());
    res.status(201).json({ success: true, data: poll });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// GET /polls  (member: active only | admin: all)
// ────────────────────────────────────────────────────────
const listPolls = async (req, res, next) => {
  try {
    const redis = getRedis();
    const isAdmin = req.user.role === 'admin';
    const cacheKey = isAdmin ? 'polls:all' : 'polls:active';

    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ success: true, cached: true, data: JSON.parse(cached) });

    const filter = isAdmin ? {} : { status: 'active' };
    const polls = await Poll.find(filter).sort({ createdAt: -1 }).select('-__v');

    await redis.set(cacheKey, JSON.stringify(polls), 'EX', POLL_LIST_TTL);
    res.json({ success: true, data: polls });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// GET /polls/:id
// ────────────────────────────────────────────────────────
const getPoll = async (req, res, next) => {
  try {
    const redis = getRedis();
    const cacheKey = `poll:${req.params.id}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ success: true, cached: true, data: JSON.parse(cached) });

    const poll = await Poll.findById(req.params.id).select('-__v');
    if (!poll) throw new NotFoundError('Poll not found');

    // Members can only see active/closed polls
    if (req.user.role !== 'admin' && poll.status === 'draft') {
      throw new ForbiddenError('Poll not available');
    }

    if (poll.status === 'active') {
      await redis.set(cacheKey, JSON.stringify(poll), 'EX', ACTIVE_POLL_TTL);
    }

    res.json({ success: true, data: poll });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// PATCH /polls/:id/status  (admin)
// ────────────────────────────────────────────────────────
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validTransitions = { draft: ['active'], active: ['closed'], closed: [] };

    const poll = await Poll.findById(req.params.id);
    if (!poll) throw new NotFoundError('Poll not found');

    if (!validTransitions[poll.status].includes(status)) {
      throw new BadRequestError(`Cannot transition poll from '${poll.status}' to '${status}'`);
    }

    if (status === 'active') poll.startTime = new Date();
    if (status === 'closed') poll.endTime = new Date();

    poll.status = status;
    await poll.save();

    await invalidatePollCache(poll._id.toString());

    // Publish event to Kafka — notification-service will fan out to all channels
    await publishEvent(status === 'active' ? 'POLL_OPENED' : 'POLL_CLOSED', {
      pollId: poll._id.toString(),
      title: poll.title,
      description: poll.description,
    });

    res.json({ success: true, data: poll });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// POST /polls/:id/positions  (admin)
// ────────────────────────────────────────────────────────
const addPosition = async (req, res, next) => {
  try {
    const { positionName } = req.body;

    const poll = await Poll.findById(req.params.id);
    if (!poll) throw new NotFoundError('Poll not found');
    if (poll.status !== 'draft') throw new BadRequestError('Can only modify polls in draft status');

    const exists = poll.positions.some((p) => p.positionName === positionName);
    if (exists) throw new BadRequestError(`Position '${positionName}' already exists`);

    poll.positions.push({ positionName, candidates: [] });
    await poll.save();

    await invalidatePollCache(poll._id.toString());
    res.status(201).json({ success: true, data: poll });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// POST /polls/:id/positions/:positionName/candidates  (admin)
// ────────────────────────────────────────────────────────
const addCandidate = async (req, res, next) => {
  try {
    const { positionName } = req.params;
    const { name, membershipId, bio, photoUrl } = req.body;

    const poll = await Poll.findById(req.params.id);
    if (!poll) throw new NotFoundError('Poll not found');
    if (poll.status !== 'draft') throw new BadRequestError('Can only modify polls in draft status');

    const position = poll.positions.find((p) => p.positionName === positionName);
    if (!position) throw new NotFoundError(`Position '${positionName}' not found`);

    const alreadyNominated = position.candidates.some((c) => c.membershipId === membershipId);
    if (alreadyNominated) throw new BadRequestError('Candidate already nominated for this position');

    position.candidates.push({ name, membershipId, bio, photoUrl });
    await poll.save();

    await invalidatePollCache(poll._id.toString());
    res.status(201).json({ success: true, data: poll });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// DELETE /polls/:id/positions/:positionName/candidates/:candidateId  (admin)
// ────────────────────────────────────────────────────────
const removeCandidate = async (req, res, next) => {
  try {
    const { positionName, candidateId } = req.params;

    const poll = await Poll.findById(req.params.id);
    if (!poll) throw new NotFoundError('Poll not found');
    if (poll.status !== 'draft') throw new BadRequestError('Can only modify polls in draft status');

    const position = poll.positions.find((p) => p.positionName === positionName);
    if (!position) throw new NotFoundError(`Position '${positionName}' not found`);

    position.candidates = position.candidates.filter((c) => c._id.toString() !== candidateId);
    await poll.save();

    await invalidatePollCache(poll._id.toString());
    res.json({ success: true, data: poll });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// DELETE /polls/:id  (admin)
// ────────────────────────────────────────────────────────
const deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) throw new NotFoundError('Poll not found');
    if (poll.status === 'active') throw new BadRequestError('Cannot delete an active poll');

    await poll.deleteOne();
    await invalidatePollCache(req.params.id);

    res.json({ success: true, message: 'Poll deleted' });
  } catch (err) { next(err); }
};

module.exports = { createPoll, listPolls, getPoll, updateStatus, addPosition, addCandidate, removeCandidate, deletePoll };
