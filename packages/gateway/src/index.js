require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Redis = require('ioredis');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimiter = require('./middleware/rateLimiter');
const { errorHandler, createLogPublisher } = require('@aveon/shared');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const POLL_SERVICE_URL = process.env.POLL_SERVICE_URL || 'http://localhost:3002';
const VOTE_SERVICE_URL = process.env.VOTE_SERVICE_URL || 'http://localhost:3003';
const MONITOR_SERVICE_URL = process.env.MONITOR_SERVICE_URL || 'http://localhost:3005';

// Redis client for log publishing
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(morgan('dev'));
app.use(rateLimiter);
app.use(createLogPublisher('gateway', redisClient));

// Healthcheck
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// Proxies
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
}));

app.use('/api/polls', createProxyMiddleware({
  target: POLL_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/polls': '/polls' },
}));

app.use('/api/votes', createProxyMiddleware({
  target: VOTE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/votes': '/votes' },
}));

app.use('/api/monitor', createProxyMiddleware({
  target: MONITOR_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/monitor': '/monitor' },
}));

// 404 & Error Handling
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`[API Gateway] Running on port ${PORT}`));
