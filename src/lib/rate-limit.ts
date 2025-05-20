import { NextResponse } from 'next/server';

const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 100; // 10 requests per hour

const ipRequests = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(ip: string): { success: boolean; message?: string } {
  const now = Date.now();
  const requestData = ipRequests.get(ip);

  if (!requestData) {
    ipRequests.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { success: true };
  }

  if (now > requestData.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { success: true };
  }

  if (requestData.count >= MAX_REQUESTS) {
    return {
      success: false,
      message: `Rate limit exceeded. Please try again in ${Math.ceil(
        (requestData.resetTime - now) / 1000 / 60
      )} minutes.`,
    };
  }

  requestData.count++;
  return { success: true };
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now > data.resetTime) {
      ipRequests.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW); 