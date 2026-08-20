// utils/cacheInvalidation.js
const redisClient = require('../redisClient');

async function invalidateResource(prefix, id) {
    const listKeys = await redisClient.keys(`${prefix}:*`);
    if (listKeys.length) await redisClient.del(listKeys);

    if (id) {
        const singular = prefix.replace(/s$/, '');
        const itemKeys = await redisClient.keys(`${singular}:*${id}*`);
        if (itemKeys.length) await redisClient.del(itemKeys);
    }
}

module.exports = { invalidateResource };