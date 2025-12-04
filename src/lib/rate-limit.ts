interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}, 60000);

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, max: 60 }
): RateLimitResult {
  const now = Date.now();
  const key = identifier;
  
  let entry = store.get(key);
  
  if (!entry || entry.resetTime < now) {
    // Create new entry
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    store.set(key, entry);
    return {
      success: true,
      remaining: config.max - 1,
      resetTime: entry.resetTime,
    };
  }
  
  if (entry.count >= config.max) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  entry.count++;
  return {
    success: true,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime,
  };
}

// Rate limit by user ID
export function rateLimitByUser(userId: string): RateLimitResult {
  return rateLimit(`user:${userId}`, { windowMs: 60000, max: 100 });
}

// Stricter rate limit for mutations
export function rateLimitMutation(userId: string): RateLimitResult {
  return rateLimit(`mutation:${userId}`, { windowMs: 60000, max: 30 });
}
