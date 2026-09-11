require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { connectRedis, getRedis } = require('./config/redis');
const { connectKafkaProducer } = require('./config/kafka');
const authRoutes = require('./routes/auth.routes');
const { errorHandler, createLogPublisher } = require('@aveon/shared');

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(createLogPublisher('auth-service', getRedis()));

// Healthcheck
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// Routes
app.use('/auth', authRoutes);

// 404 & Error Handler
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

// Initialize DB, Redis, Kafka Producer and Start Server
Promise.all([connectDB(), connectRedis(), connectKafkaProducer()]).then(() => {
  app.listen(PORT, () => console.log(`[Auth Service] Running on port ${PORT}`));
}).catch((err) => {
  console.error('[Auth Service] Startup Error:', err);
  process.exit(1);
});

