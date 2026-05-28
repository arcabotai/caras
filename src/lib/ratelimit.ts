import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const FREE_MESSAGE_LIMIT = 50;

// ─── Redis singleton ─────────────────────────────────────────────────────────
type RedisClient = Redis | null;

let _redis: RedisClient = null;

function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set");
  }

  _redis = new Redis({ url, token });
  return _redis;
}

// ─── Ratelimit instance (sliding window, 1-day rolling window) ──────────────
let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit {
  if (_ratelimit) return _ratelimit;

  _ratelimit = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(FREE_MESSAGE_LIMIT, "1 d"),
    analytics: true,
    prefix: "talkie-chat",
  });

  return _ratelimit;
}

/**
 * Check rate limit for a user.
 * Returns { success, remaining, reset, isPremium }.
 * On Redis failure, allows the request through and returns a safe fallback.
 */
export async function checkRateLimit(
  userId: string,
  isPremium: boolean
): Promise<{ success: boolean; remaining: number; reset: number; isPremium: boolean }> {
  // Premium users bypass the limit entirely
  if (isPremium) {
    return { success: true, remaining: 9999, reset: 0, isPremium: true };
  }

  try {
    const ratelimit = getRatelimit();
    const result = await ratelimit.limit(userId);

    return {
      success: result.success,
      remaining: result.remaining ?? 0,
      reset: result.reset ?? 0,
      isPremium: false,
    };
  } catch (err) {
    // Redis connection failure — fail open (allow request, log error)
    console.error("[ratelimit] Redis error, allowing request through:", err);
    return { success: true, remaining: 0, reset: 0, isPremium: false };
  }
}

/**
 * Get the configured free tier message limit.
 */
export function getMessageLimit(isPremium: boolean): number {
  return isPremium ? 9999 : FREE_MESSAGE_LIMIT;
}

/**
 * Get rate limit status for a user (used by /api/ratelimit/status endpoint).
 */
export async function getRateLimitStatus(
  userId: string,
  isPremium: boolean
): Promise<{ used: number; limit: number; remaining: number; isPremium: boolean; resetsAt: Date | null }> {
  if (isPremium) {
    return {
      used: 0,
      limit: 9999,
      remaining: 9999,
      isPremium: true,
      resetsAt: null,
    };
  }

  try {
    const ratelimit = getRatelimit();
    const result = await ratelimit.limit(userId);

    return {
      used: FREE_MESSAGE_LIMIT - (result.remaining ?? 0),
      limit: FREE_MESSAGE_LIMIT,
      remaining: result.remaining ?? 0,
      isPremium: false,
      resetsAt: result.reset ? new Date(result.reset * 1000) : null,
    };
  } catch (err) {
    console.error("[ratelimit] Redis error in getRateLimitStatus:", err);
    return {
      used: 0,
      limit: FREE_MESSAGE_LIMIT,
      remaining: FREE_MESSAGE_LIMIT,
      isPremium: false,
      resetsAt: null,
    };
  }
}
