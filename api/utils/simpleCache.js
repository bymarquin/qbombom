'use strict';

const cache = new Map();
let redisClient = null;
let redisReady = false;
let redisInitializing = false;

const REDIS_PREFIX = process.env.REDIS_PREFIX || 'qbombom:';

function withPrefix(key) {
  return `${REDIS_PREFIX}${key}`;
}

async function ensureRedis() {
  if (redisReady || redisInitializing) return;
  if (!process.env.REDIS_URL) return;

  redisInitializing = true;
  try {
    const redis = require('redis');
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', () => {
      redisReady = false;
    });
    await redisClient.connect();
    redisReady = true;
  } catch (_) {
    redisClient = null;
    redisReady = false;
  } finally {
    redisInitializing = false;
  }
}

async function get(key) {
  await ensureRedis();

  if (redisReady && redisClient) {
    try {
      const raw = await redisClient.get(withPrefix(key));
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      // fallback to memory
    }
  }

  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

async function set(key, value, ttlMs) {
  await ensureRedis();
  const ttl = Math.max(Number(ttlMs) || 0, 0);

  if (redisReady && redisClient) {
    try {
      await redisClient.set(withPrefix(key), JSON.stringify(value), { PX: ttl });
      return;
    } catch (_) {
      // fallback to memory
    }
  }

  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

async function del(key) {
  await ensureRedis();

  if (redisReady && redisClient) {
    try {
      await redisClient.del(withPrefix(key));
    } catch (_) {
      // keep memory cleanup
    }
  }

  cache.delete(key);
}

async function delByPrefix(prefix) {
  await ensureRedis();

  if (redisReady && redisClient) {
    try {
      let cursor = 0;
      const match = withPrefix(`${prefix}*`);
      do {
        const result = await redisClient.scan(cursor, { MATCH: match, COUNT: 100 });
        cursor = result.cursor;
        if (Array.isArray(result.keys) && result.keys.length) {
          if (result.keys.length === 1) await redisClient.del(result.keys[0]);
          else await redisClient.del(result.keys);
        }
      } while (cursor !== 0);
    } catch (_) {
      // fallback to memory cleanup
    }
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

module.exports = {
  get,
  set,
  del,
  delByPrefix,
};
