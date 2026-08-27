import { adminDb } from "./firebase-admin";

export type RateLimitPolicy = "STRICT" | "MODERATE" | "RELAXED";

const POLICIES = {
    STRICT: { maxRequests: 5, windowMs: 60000 },       // 5 per minute
    MODERATE: { maxRequests: 30, windowMs: 60000 },    // 30 per minute
    RELAXED: { maxRequests: 100, windowMs: 60000 },    // 100 per minute
};

/**
 * Distributed Rate Limiter using Firestore
 * (In production, replace with Redis / Upstash for performance)
 */
export async function checkRateLimit(ip: string, endpoint: string, policy: RateLimitPolicy): Promise<{ allowed: boolean, remaining: number }> {
    const { maxRequests, windowMs } = POLICIES[policy];
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Create a deterministic key for the IP+endpoint+window
    const timeWindow = Math.floor(now / windowMs);
    const key = `${ip}_${endpoint}_${timeWindow}`;
    
    const ref = adminDb.collection("rate_limits").doc(key);
    
    try {
        const result = await adminDb.runTransaction(async (t) => {
            const doc = await t.get(ref);
            if (!doc.exists) {
                t.set(ref, { count: 1, expiresAt: now + windowMs });
                return { allowed: true, remaining: maxRequests - 1 };
            }
            
            const count = doc.data()?.count || 0;
            if (count >= maxRequests) {
                return { allowed: false, remaining: 0 };
            }
            
            t.update(ref, { count: count + 1 });
            return { allowed: true, remaining: maxRequests - count - 1 };
        });
        return result;
    } catch (e) {
        // Fail open if rate limiter crashes (to avoid taking down the whole app)
        console.error("Rate Limiter Error:", e);
        return { allowed: true, remaining: 1 };
    }
}
