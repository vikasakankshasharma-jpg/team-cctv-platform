import { NextRequest } from "next/server";

const rateLimitMap = new Map();

export function rateLimit(request: NextRequest, limit: number = 5, windowMs: number = 60000) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, {
      count: 1,
      lastRequest: now,
    });
    return { success: true };
  }

  const data = rateLimitMap.get(ip);
  
  if (now - data.lastRequest > windowMs) {
    data.count = 1;
    data.lastRequest = now;
    return { success: true };
  }

  if (data.count >= limit) {
    return { success: false, remaining: 0 };
  }

  data.count += 1;
  return { success: true, remaining: limit - data.count };
}
