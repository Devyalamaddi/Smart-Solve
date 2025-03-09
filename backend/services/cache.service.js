
const Redis = require('ioredis');
const winston = require('winston');

// Initialize Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
});

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'cache-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/cache.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Event listeners for Redis
redisClient.on('error', (error) => {
  logger.error('Redis Error:', error);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

// File: services/cache.service.js (continued)

// Caching service methods
const cacheService = {
  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache (will be JSON stringified)
   * @param {number} ttl - Time to live in seconds
   */
  async set(key, value, ttl = 3600) {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await redisClient.setex(key, ttl, stringValue);
      } else {
        await redisClient.set(key, stringValue);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {*} The parsed value or null if not found
   */
  async get(key) {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {boolean} True if successful, false otherwise
   */
  async delete(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  /**
   * Clear cache by pattern
   * @param {string} pattern - Pattern to match keys (e.g. 'user:*')
   * @returns {boolean} True if successful, false otherwise
   */
  async clearByPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache clear by pattern error:', error);
      return false;
    }
  },

  /**
   * Get multiple values from cache
   * @param {Array<string>} keys - Array of cache keys
   * @returns {Array<*>} Array of parsed values or null for keys not found
   */
  async mget(keys) {
    try {
      const values = await redisClient.mget(keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      logger.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  },

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean} True if the key exists, false otherwise
   */
  async exists(key) {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  /**
   * Set key expiration
   * @param {string} key - Cache key
   * @param {number} seconds - Time to live in seconds
   * @returns {boolean} True if successful, false otherwise
   */
  async expire(key, seconds) {
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  },

  /**
   * Get the client for advanced operations
   * @returns {Redis} Redis client instance
   */
  getClient() {
    return redisClient;
  }
};

module.exports = cacheService;