import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
// Note: These env vars must be set in your deployment environment (e.g., Vercel)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache for ratelimiters with different configurations
const ratelimiters = new Map<string, Ratelimit>();

function getRatelimiter(limit: number, windowMs: number) {
  const windowSeconds = Math.max(1, Math.floor(windowMs / 1000));
  const key = `${limit}_${windowSeconds}`;
  
  if (!ratelimiters.has(key)) {
    ratelimiters.set(key, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: true,
      prefix: `@upstash/ratelimit/${key}`,
    }));
  }
  return ratelimiters.get(key)!;
}

function getClientKey(request: NextRequest | Request) {
  const headers = request.headers;
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return headers.get("x-real-ip") || "anonymous";
}

/**
 * Enterprise Rate Limiting using Redis (Upstash)
 * Awaits the limit result from Redis.
 */
export async function rateLimit(request: NextRequest | Request, limit: number = 5, windowMs: number = 60000) {
  // If env vars are missing, fallback to allowing (but log error in dev)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("⚠️ Upstash Redis credentials missing. Rate limiting is currently disabled.");
    }
    return { success: true, remaining: limit, reset: Date.now() + windowMs };
  }

  try {
    const ip = getClientKey(request);
    const identifier = `ratelimit_${ip}`;
    const ratelimiter = getRatelimiter(limit, windowMs);
    
    const { success, remaining, reset } = await ratelimiter.limit(identifier);
    
    return { success, remaining, reset };
  } catch (error) {
    console.error("❌ Rate limit error:", error);
    // Fail open in case of Redis issues to prevent service outage, but log the failure
    return { success: true, remaining: 1, reset: Date.now() + windowMs };
  }
}
