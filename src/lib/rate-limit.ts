/**
 * Lightweight In-Memory Sliding-Window Rate Limiter
 * Suitable for single-instance or containerized edge environments
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const cache = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (value.resetAt <= now) {
        cache.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export function rateLimit(options: RateLimitOptions): {
  isRateLimited: boolean;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const record = cache.get(options.key);

  if (!record || record.resetAt <= now) {
    // Start new window
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + options.windowMs,
    };
    cache.set(options.key, newRecord);
    return {
      isRateLimited: false,
      remaining: options.limit - 1,
      resetAt: newRecord.resetAt,
    };
  }

  if (record.count >= options.limit) {
    return {
      isRateLimited: true,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  return {
    isRateLimited: false,
    remaining: options.limit - record.count,
    resetAt: record.resetAt,
  };
}

export function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowSeconds = 900
): { success: boolean; remaining: number } {
  const res = rateLimit({ key, limit: maxAttempts, windowMs: windowSeconds * 1000 });
  return {
    success: !res.isRateLimited,
    remaining: res.remaining,
  };
}
