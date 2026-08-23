const Redis = require('ioredis');
const config = require('../config');

class MemoryStore {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  async get(key) {
    const expiresAt = this.ttls.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async set(key, value, mode, duration) {
    this.store.set(key, value);
    if (mode === 'EX' && duration) {
      this.ttls.set(key, Date.now() + duration * 1000);
    } else {
      this.ttls.delete(key);
    }
    return 'OK';
  }

  async del(key) {
    this.ttls.delete(key);
    return this.store.delete(key) ? 1 : 0;
  }

  async keys(pattern) {
    const now = Date.now();
    for (const [key, expiresAt] of this.ttls.entries()) {
      if (expiresAt && now > expiresAt) {
        this.store.delete(key);
        this.ttls.delete(key);
      }
    }
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(this.store.keys()).filter((k) => regex.test(k));
  }
}

let client = null;
let isConnected = false;
let memoryFallback = new MemoryStore();

const getRedisClient = () => {
  if (!client && config.redisUrl) {
    try {
      client = new Redis(config.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
        enableOfflineQueue: false
      });

      client.on('connect', () => {
        isConnected = true;
      });

      client.on('error', (err) => {
        isConnected = false;
      });

      client.connect().catch(() => {
        isConnected = false;
      });
    } catch (e) {
      isConnected = false;
    }
  }
  return client;
};

const setWithTTL = async (key, value, seconds) => {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  const redis = getRedisClient();
  if (isConnected && redis) {
    try {
      return await redis.set(key, serialized, 'EX', seconds);
    } catch (e) {
      return await memoryFallback.set(key, serialized, 'EX', seconds);
    }
  }
  return await memoryFallback.set(key, serialized, 'EX', seconds);
};

const get = async (key) => {
  const redis = getRedisClient();
  let result = null;
  if (isConnected && redis) {
    try {
      result = await redis.get(key);
    } catch (e) {
      result = await memoryFallback.get(key);
    }
  } else {
    result = await memoryFallback.get(key);
  }
  if (!result) return null;
  try {
    return JSON.parse(result);
  } catch (e) {
    return result;
  }
};

const del = async (key) => {
  const redis = getRedisClient();
  if (isConnected && redis) {
    try {
      return await redis.del(key);
    } catch (e) {
      return await memoryFallback.del(key);
    }
  }
  return await memoryFallback.del(key);
};

const keys = async (pattern) => {
  const redis = getRedisClient();
  if (isConnected && redis) {
    try {
      return await redis.keys(pattern);
    } catch (e) {
      return await memoryFallback.keys(pattern);
    }
  }
  return await memoryFallback.keys(pattern);
};

module.exports = {
  setWithTTL,
  get,
  del,
  keys,
  getRedisClient
};
