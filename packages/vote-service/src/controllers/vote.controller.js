const axios = require('axios');
const Vote = require('../models/Vote');
const VoterRecord = require('../models/VoterRecord');
const { getRedis } = require('../config/redis');
const { BadRequestError, NotFoundError, ForbiddenError } = require('@aveon/shared');

const POLL_SERVICE = process.env.POLL_SERVICE_URL || 'http://poll-service:3002';
const RESULTS_CACHE_TTL = 30; // 30s cache for results

// ── Fetch poll from poll-service ──────────────────────────
const fetchPoll = async (pollId, token) => {
  try {
    const { data } = await axios.get(`${POLL_SERVICE}/polls/${pollId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.data;
  } catch (err) {
    if (err.response?.status === 404) throw new NotFoundError('Poll not found');
    throw new BadRequestError('Could not fetch poll details');
  }
};

// ────────────────────────────────────────────────────────
// POST /votes  (member)
// ────────────────────────────────────────────────────────
const castVotes = async (req, res, next) => {
  try {
    const { pollId, votes } = req.body;
    const voterId = req.user.sub;

    // Get raw token to pass along for service-to-service calls
    const token = req.headers.authorization.split(' ')[1];

    // 1. Validate poll is active
    const poll = await fetchPoll(pollId, token);
    if (poll.status !== 'active') {
      throw new BadRequestError('This poll is not currently accepting votes');
    }

    // 2. Validate all submitted positions/candidates exist in the poll
    for (const vote of votes) {
      const position = poll.positions.find((p) => p.positionName === vote.positionName);
      if (!position) throw new BadRequestError(`Position '${vote.positionName}' not found in this poll`);

      const candidate = position.candidates.find((c) => c._id.toString() === vote.candidateId);
      if (!candidate) throw new BadRequestError(`Candidate not found for position '${vote.positionName}'`);
    }

    const redis = getRedis();

    // 3. Atomic double-vote check via Redis (fast path)
    for (const vote of votes) {
      const guardKey = `voted:${pollId}:${voterId}:${vote.positionName}`;
      const alreadyVoted = await redis.get(guardKey);
      if (alreadyVoted) {
        throw new BadRequestError(`You have already voted for '${vote.positionName}'`);
      }
    }

    // 4. DB fallback check (in case Redis was flushed)
    const voterRecord = await VoterRecord.findOne({ pollId, voterId });
    if (voterRecord) {
      const duplicates = votes.filter((v) => voterRecord.votedPositions.includes(v.positionName));
      if (duplicates.length > 0) {
        throw new BadRequestError(`Already voted for: ${duplicates.map(d => d.positionName).join(', ')}`);
      }
    }

    // 5. Insert anonymous votes + update Redis counters
    const voteDocuments = votes.map((v) => ({
      pollId,
      positionName: v.positionName,
      candidateId: v.candidateId,
      castedAt: new Date(),
    }));

    await Vote.insertMany(voteDocuments);

    // 6. Set Redis guard keys (expire in 30 days as safety net)
    const pipeline = redis.pipeline();
    for (const vote of votes) {
      const guardKey = `voted:${pollId}:${voterId}:${vote.positionName}`;
      pipeline.set(guardKey, '1', 'EX', 30 * 24 * 60 * 60);
      pipeline.incr(`votecount:${pollId}:${vote.positionName}:${vote.candidateId}`);
    }
    await pipeline.exec();

    // 7. Update VoterRecord (upsert — no link to specific Vote docs)
    await VoterRecord.findOneAndUpdate(
      { pollId, voterId },
      { $addToSet: { votedPositions: { $each: votes.map((v) => v.positionName) } } },
      { upsert: true, new: true }
    );

    // 8. Publish event
    await redis.publish('vote:events', JSON.stringify({
      type: 'VOTE_CAST',
      pollId,
      positionsVoted: votes.map((v) => v.positionName),
      timestamp: new Date().toISOString(),
    }));

    res.status(201).json({
      success: true,
      message: 'Your votes have been recorded anonymously',
    });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// GET /votes/status/:pollId  (member — check own vote status)
// ────────────────────────────────────────────────────────
const getVoteStatus = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const voterId = req.user.sub;

    const record = await VoterRecord.findOne({ pollId, voterId });

    res.json({
      success: true,
      data: {
        hasVoted: !!record,
        votedPositions: record?.votedPositions || [],
      },
    });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// GET /votes/results/:pollId  (admin: any time | member: after close)
// ────────────────────────────────────────────────────────
const getResults = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const isAdmin = req.user.role === 'admin';
    const token = req.headers.authorization.split(' ')[1];

    const poll = await fetchPoll(pollId, token);

    if (!isAdmin && poll.status !== 'closed') {
      throw new ForbiddenError('Results are only available after the poll closes');
    }

    // Check cache
    const redis = getRedis();
    const cacheKey = `results:${pollId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json({ success: true, cached: true, data: JSON.parse(cached) });

    // Aggregate from MongoDB
    const rawResults = await Vote.aggregate([
      { $match: { pollId: new (require('mongoose').Types.ObjectId)(pollId) } },
      { $group: { _id: { positionName: '$positionName', candidateId: '$candidateId' }, count: { $sum: 1 } } },
      { $sort: { '_id.positionName': 1, count: -1 } },
    ]);

    // Map results with candidate names from poll
    const results = poll.positions.map((position) => {
      const positionResults = rawResults
        .filter((r) => r._id.positionName === position.positionName)
        .map((r) => {
          const candidate = position.candidates.find(
            (c) => c._id.toString() === r._id.candidateId.toString()
          );
          return {
            candidateId: r._id.candidateId,
            name: candidate?.name || 'Unknown',
            membershipId: candidate?.membershipId || '',
            votes: r.count,
          };
        });

      const totalVotes = positionResults.reduce((sum, c) => sum + c.votes, 0);
      return {
        positionName: position.positionName,
        totalVotes,
        candidates: positionResults,
        winner: positionResults[0] || null,
      };
    });

    const response = {
      pollId,
      pollTitle: poll.title,
      status: poll.status,
      results,
    };

    // Cache for 30s (or longer if closed)
    const cacheTTL = poll.status === 'closed' ? 3600 : RESULTS_CACHE_TTL;
    await redis.set(cacheKey, JSON.stringify(response), 'EX', cacheTTL);

    res.json({ success: true, data: response });
  } catch (err) { next(err); }
};

// ────────────────────────────────────────────────────────
// GET /votes/count/:pollId  (admin — live vote counts from Redis)
// ────────────────────────────────────────────────────────
const getLiveCount = async (req, res, next) => {
  try {
    const { pollId } = req.params;
    const token = req.headers.authorization.split(' ')[1];

    const poll = await fetchPoll(pollId, token);
    const redis = getRedis();

    const liveCounts = {};
    for (const position of poll.positions) {
      liveCounts[position.positionName] = {};
      for (const candidate of position.candidates) {
        const key = `votecount:${pollId}:${position.positionName}:${candidate._id}`;
        const count = await redis.get(key);
        liveCounts[position.positionName][candidate.name] = parseInt(count || '0', 10);
      }
    }

    // Total participation count
    const totalVoters = await VoterRecord.countDocuments({ pollId });

    res.json({
      success: true,
      data: { pollId, pollTitle: poll.title, totalParticipants: totalVoters, liveCounts },
    });
  } catch (err) { next(err); }
};

module.exports = { castVotes, getVoteStatus, getResults, getLiveCount };
