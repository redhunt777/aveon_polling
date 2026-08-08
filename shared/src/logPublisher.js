/**
 * createLogPublisher — factory that returns an Express middleware.
 * Publishes structured request/response log entries to Redis channel `service:logs`.
 *
 * @param {string} serviceName  e.g. 'auth-service'
 * @param {import('ioredis').Redis} redisClient  an already-connected ioredis instance
 */
const createLogPublisher = (serviceName, redisClient) => {
    return (req, res, next) => {
        const startedAt = Date.now();

        res.on('finish', () => {
            try {
                const status = res.statusCode;
                const entry = {
                    service: serviceName,
                    method: req.method,
                    path: req.path,
                    status,
                    responseTime: Date.now() - startedAt,
                    ip: req.ip || req.headers['x-forwarded-for'] || '?',
                    userAgent: req.headers['user-agent'] || '',
                    level: status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info',
                    timestamp: new Date().toISOString(),
                };

                // Fire-and-forget publish — do not block the request
                redisClient.publish('service:logs', JSON.stringify(entry)).catch(() => { });
            } catch (_) {
                // Never let logging break the request
            }
        });

        next();
    };
};

module.exports = { createLogPublisher };
