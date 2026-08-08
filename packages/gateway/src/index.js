require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimiter = require('./middleware/rateLimiter');
const { errorHandler } = require('@aveon/shared');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const POLL_SERVICE_URL = process.env.POLL_SERVICE_URL || 'http://localhost:3002';
const VOTE_SERVICE_URL = process.env.VOTE_SERVICE_URL || 'http://localhost:3003';

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(rateLimiter);

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

// 404 & Error Handling
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`[API Gateway] Running on port ${PORT}`));
