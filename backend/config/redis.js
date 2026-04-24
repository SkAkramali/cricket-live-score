const redis = require('redis');

let redisClient = null;
let isRedisEnabled = false;

/**
 * Initialize Redis client
 * @returns {Promise<Object>} Redis client instance
 */
const initializeRedis = async () => {
  try {
    if (process.env.REDIS_HOST) {
      redisClient = redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: process.env.REDIS_DB || 0
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        isRedisEnabled = false;
      });

      redisClient.on('connect', () => {
        console.log('Redis client connected');
        isRedisEnabled = true;
      });

      await redisClient.connect();
      return redisClient;
    } else {
      console.log('Redis not configured. Caching disabled.');
      return null;
    }
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    isRedisEnabled = false;
    return null;
  }
};

/**
 * Get Redis client instance
 * @returns {Object} Redis client
 */
const getRedisClient = () => {
  return redisClient;
};

/**
 * Check if Redis is enabled and connected
 * @returns {Boolean}
 */
const isRedisConnected = () => {
  return isRedisEnabled && redisClient && redisClient.isReady;
};

/**
 * Set value in cache
 * @param {String} key - Cache key
 * @param {*} value - Value to cache
 * @param {Number} ttl - Time to live in seconds (default: 300)
 * @returns {Promise<Boolean>}
 */
const setCache = async (key, value, ttl = 300) => {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    const serialized = JSON.stringify(value);
    await redisClient.setEx(key, ttl, serialized);
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

/**
 * Get value from cache
 * @param {String} key - Cache key
 * @returns {Promise<*>} Cached value or null
 */
const getCache = async (key) => {
  try {
    if (!isRedisConnected()) {
      return null;
    }

    const cached = await redisClient.get(key);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

/**
 * Delete key from cache
 * @param {String} key - Cache key
 * @returns {Promise<Boolean>}
 */
const deleteCache = async (key) => {
  try {
    if (!isRedisConnected()) {
      return false;
    }

    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

/**
 * Delete multiple keys matching pattern
 * @param {String} pattern - Key pattern (e.g., 'match:*')
 * @returns {Promise<Number>} Number of keys deleted
 */
const deleteCachePattern = async (pattern) => {
  try {
    if (!isRedisConnected()) {
      return 0;
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    await redisClient.del(keys);
    return keys.length;
  } catch (error) {
    console.error('Cache pattern delete error:', error);
    return 0;
  }
};

/**
 * Cache middleware for Express routes
 * @param {Number} ttl - Time to live in seconds
 * @returns {Function} Middleware function
 */
const cacheMiddleware = (ttl = 300) => {
  return async (req, res, next) => {
    if (!isRedisConnected()) {
      return next();
    }

    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await getCache(key);
      
      if (cached) {
        return res.json(cached);
      }

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        setCache(key, data, ttl);
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

module.exports = {
  initializeRedis,
  getRedisClient,
  isRedisConnected,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  cacheMiddleware
};
