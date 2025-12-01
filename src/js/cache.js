/**
 * Cache Manager for API responses
 * Handles client-side caching with TTL support
 */
class CacheManager {
  constructor() {
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/not found
   */
  get(key) {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return data;
    } catch (error) {
      console.warn(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, data, ttl = this.defaultTTL) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          data,
          timestamp: Date.now(),
          ttl
        })
      );
    } catch (error) {
      console.warn(`Cache set error for ${key}:`, error);
    }
  }

  /**
   * Invalidate specific cache key
   * @param {string} key - Cache key to invalidate
   */
  invalidate(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Cache invalidate error for ${key}:`, error);
    }
  }

  /**
   * Invalidate multiple cache keys
   * @param {string[]} keys - Array of cache keys to invalidate
   */
  invalidateMultiple(keys) {
    keys.forEach(key => this.invalidate(key));
  }

  /**
   * Clear all application cache
   */
  clearAll() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('_cache') || key.includes('cache_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache clearAll error:', error);
    }
  }
}

// Initialize global cache manager
const cache = new CacheManager();
