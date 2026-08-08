require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Redis = require('ioredis');
const { verifyToken, UnauthorizedError, ForbiddenError } = require('@aveon/shared');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const PORT = process.env.MONITOR_PORT || 3005;
const MAX_LOG_ENTRIES = 2000;
const LOG_LIST_KEY = 'monitor:logs';
const HEARTBEAT_KEY_PREFIX = 'monitor:heartbeat:';

// ── Two Redis clients: one for subscribe, one for commands ──
const redisSubscriber = new Redis(REDIS_URL);
const redisClient = new Redis(REDIS_URL);

redisClient.on('connect', () => console.log('[Monitor Service] Redis Connected'));
redisClient.on('error', (err) => console.error('[Monitor Service] Redis Error:', err.message));

// Active SSE clients (Set of response objects)
const sseClients = new Set();

// ── Subscribe to service logs ──────────────────────────────
redisSubscriber.subscribe('service:logs', (err) => {
    if (err) console.error('[Monitor Service] Subscription error:', err.message);
    else console.log('[Monitor Service] Subscribed to service:logs');
});

redisSubscriber.on('message', async (_channel, message) => {
    try {
        const entry = JSON.parse(message);

        // Store in Redis list (newest first), keep max 2000
        await redisClient.lpush(LOG_LIST_KEY, message);
        await redisClient.ltrim(LOG_LIST_KEY, 0, MAX_LOG_ENTRIES - 1);

        // Track last-seen heartbeat per service
        await redisClient.set(
            `${HEARTBEAT_KEY_PREFIX}${entry.service}`,
            JSON.stringify({ lastSeen: entry.timestamp, service: entry.service }),
            'EX', 300  // expire after 5 min inactivity
        );

        // Broadcast to all SSE clients
        const sseData = `data: ${message}\n\n`;
        for (const client of sseClients) {
            client.write(sseData);
        }
    } catch (err) {
        console.error('[Monitor Service] Error processing log entry:', err.message);
    }
});

// ── Express App ───────────────────────────────────────────
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── Auth Middleware ───────────────────────────────────────
const authenticate = (req, _res, next) => {
    try {
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) throw new UnauthorizedError('No token provided');
        req.user = verifyToken(auth.split(' ')[1]);
        next();
    } catch (err) {
        next(err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError'
            ? new UnauthorizedError('Invalid or expired token')
            : err);
    }
};

const adminOnly = (req, _res, next) => {
    if (req.user?.role !== 'admin') return next(new ForbiddenError('Admin access required'));
    next();
};

// ── Health ────────────────────────────────────────────────
app.get('/monitor/health', (_req, res) =>
    res.json({ status: 'ok', service: 'monitor-service' })
);

// Apply auth + admin guard to all /monitor routes below
app.use('/monitor', authenticate, adminOnly);

// ── GET /monitor/logs ─────────────────────────────────────
// Query params: page, limit, service, level
app.get('/monitor/logs', async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
        const filterService = req.query.service || null;
        const filterLevel = req.query.level || null;

        // Fetch all stored entries (up to MAX_LOG_ENTRIES)
        const raw = await redisClient.lrange(LOG_LIST_KEY, 0, MAX_LOG_ENTRIES - 1);
        let entries = raw.map((r) => {
            try { return JSON.parse(r); } catch { return null; }
        }).filter(Boolean);

        // Apply filters
        if (filterService) entries = entries.filter((e) => e.service === filterService);
        if (filterLevel) entries = entries.filter((e) => e.level === filterLevel);

        const total = entries.length;
        const start = (page - 1) * limit;
        const paginated = entries.slice(start, start + limit);

        res.json({
            success: true,
            data: {
                logs: paginated,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (err) { next(err); }
});

// ── GET /monitor/logs/stream  (SSE) ───────────────────────
app.get('/monitor/logs/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if applicable
    res.flushHeaders();

    // Send a comment keep-alive every 20s so proxies don't close idle connections
    const keepAlive = setInterval(() => res.write(': ping\n\n'), 20000);

    sseClients.add(res);
    console.log(`[Monitor Service] SSE client connected (total: ${sseClients.size})`);

    req.on('close', () => {
        clearInterval(keepAlive);
        sseClients.delete(res);
        console.log(`[Monitor Service] SSE client disconnected (total: ${sseClients.size})`);
    });
});

// ── GET /monitor/services ─────────────────────────────────
// Returns last-seen heartbeat for each known service
app.get('/monitor/services', async (req, res, next) => {
    try {
        const keys = await redisClient.keys(`${HEARTBEAT_KEY_PREFIX}*`);
        const services = [];
        for (const key of keys) {
            const val = await redisClient.get(key);
            if (val) {
                try { services.push(JSON.parse(val)); } catch { /* skip */ }
            }
        }
        res.json({ success: true, data: services });
    } catch (err) { next(err); }
});

// ── DELETE /monitor/logs ──────────────────────────────────
app.delete('/monitor/logs', async (req, res, next) => {
    try {
        await redisClient.del(LOG_LIST_KEY);
        res.json({ success: true, message: 'All logs cleared' });
    } catch (err) { next(err); }
});

// ── 404 & Error Handler ───────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, _req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : 'Internal server error';
    res.status(statusCode).json({ success: false, message });
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => console.log(`[Monitor Service] Running on port ${PORT}`));
