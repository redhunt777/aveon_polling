const Redis = require('ioredis');

let redisClient = null;

const connectRedis = () => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    redisClient.on('connect', () => console.log('[Vote Service] Redis Connected'));
    redisClient.on('error', (err) => console.error('[Vote Service] Redis Error:', err.message));
  }
  return redisClient;
};

const getRedis = () => {
  if (!redisClient) {
    return connectRedis();
  }
  return redisClient;
};

module.exports = { connectRedis, getRedis };
