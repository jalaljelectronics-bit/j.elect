// middleware/cache.js
const redisClient = require('../redisClient');

function cacheMiddleware(prefix, ttlSeconds) {
  return async (req, res, next) => {
    const cacheKey = `${prefix}:${JSON.stringify(req.query)}${req.params.id ? `:${req.params.id}` : ''}`;

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (err) {
      console.error('Redis GET failed:', err);
    }

    // capture res.json to store the response before sending it
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(body)).catch((err) =>
        console.error('Redis SET failed:', err)
      );
      return originalJson(body);
    };

    next();
  };
}

module.exports = cacheMiddleware;