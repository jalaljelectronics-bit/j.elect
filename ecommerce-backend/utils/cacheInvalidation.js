// utils/cacheInvalidation.js
const redisClient = require('../redisClient');

async function invalidateResource(prefix, id) {
    const keys = await redisClient.keys(`${prefix}:*`);
    if (keys.length) await redisClient.del(keys);
    if (id) await redisClient.del(`${prefix.replace(/s$/, '')}:${id}`);
}

module.exports = { invalidateResource };