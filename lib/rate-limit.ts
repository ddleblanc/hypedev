/**
 * Production-grade rate limiting with rate-limiter-flexible
 * Supports both IP-based and wallet-based limiting
 * @module lib/rate-limit
 */
import { RateLimiterRedis, RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { getRedis } from "./redis";
import { NextResponse } from "next/server";

// Cache for memory limiters (development fallback)
const memoryLimiterCache = new Map<string, RateLimiterMemory>();

// Rate limiter configurations
export interface RateLimitConfig {
  points: number; // Number of requests
  duration: number; // Per seconds
  blockDuration?: number; // Block for seconds when limit exceeded
}

// Pre-configured limiters for different endpoints
export const RATE_LIMITS = {
  // Authentication - verify endpoint is lightweight (JWT check only)
  auth: {
    points: 60,
    duration: 60,
    blockDuration: 30,
  },
  loginPayload: {
    points: 10,
    duration: 60,
    blockDuration: 60,
  },
  loginVerify: {
    points: 10,
    duration: 60,
    blockDuration: 60,
  },

  // API - general limits
  api: {
    points: 100,
    duration: 60,
  },
  apiWrite: {
    points: 30,
    duration: 60,
  },

  // Expensive operations
  search: {
    points: 30,
    duration: 60,
  },
  upload: {
    points: 10,
    duration: 60,
  },

  // Blockchain operations (extra protection)
  blockchain: {
    points: 20,
    duration: 60,
    blockDuration: 60,
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

// Cache for rate limiter instances
const limiterCache = new Map<string, RateLimiterRedis | RateLimiterMemory>();

function getLimiter(type: RateLimitType): RateLimiterRedis | RateLimiterMemory {
  const cached = limiterCache.get(type);
  if (cached) return cached;

  const config = RATE_LIMITS[type];

  try {
    const redis = getRedis();
    const limiter = new RateLimiterRedis({
      storeClient: redis,
      keyPrefix: `ratelimit:${type}`,
      points: config.points,
      duration: config.duration,
      ...("blockDuration" in config && { blockDuration: config.blockDuration }),
    });
    limiterCache.set(type, limiter);
    return limiter;
  } catch {
    // Fallback to memory limiter in development
    if (process.env.NODE_ENV === "development") {
      const cachedMemory = memoryLimiterCache.get(type);
      if (cachedMemory) return cachedMemory;

      const memoryLimiter = new RateLimiterMemory({
        points: config.points,
        duration: config.duration,
        blockDuration: "blockDuration" in config ? config.blockDuration : undefined,
      });
      memoryLimiterCache.set(type, memoryLimiter);
      console.warn(`Using memory rate limiter for ${type} (development only)`);
      return memoryLimiter;
    }
    throw new Error("Redis required for rate limiting in production");
  }
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // Seconds until retry
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const limiter = getLimiter(type);
  const config = RATE_LIMITS[type];

  try {
    const res = await limiter.consume(identifier);
    return {
      success: true,
      limit: config.points,
      remaining: res.remainingPoints,
      reset: Math.floor(Date.now() / 1000) + Math.ceil(res.msBeforeNext / 1000),
    };
  } catch (rejRes) {
    if (rejRes instanceof RateLimiterRes) {
      const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000);
      return {
        success: false,
        limit: config.points,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + retryAfter,
        retryAfter,
      };
    }
    // Unexpected error - allow request but log
    console.error("Rate limiter error:", rejRes);
    return {
      success: true,
      limit: config.points,
      remaining: config.points,
      reset: Math.floor(Date.now() / 1000) + config.duration,
    };
  }
}

/**
 * Get client identifier from request
 * Prefers wallet address over IP for authenticated users
 */
export function getClientIdentifier(request: Request): { type: "wallet" | "ip"; value: string } {
  // Check for wallet address (authenticated user)
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const wallet = authHeader.slice(7).toLowerCase();
    if (wallet.startsWith("0x") && wallet.length === 42) {
      return { type: "wallet", value: wallet };
    }
  }

  const walletHeader = request.headers.get("X-Wallet-Address");
  if (walletHeader?.startsWith("0x") && walletHeader.length === 42) {
    return { type: "wallet", value: walletHeader.toLowerCase() };
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get("X-Forwarded-For");
  if (forwardedFor) {
    return { type: "ip", value: forwardedFor.split(",")[0].trim() };
  }

  const realIP = request.headers.get("X-Real-IP");
  if (realIP) {
    return { type: "ip", value: realIP };
  }

  return { type: "ip", value: "unknown" };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toString());

  if (result.retryAfter) {
    response.headers.set("Retry-After", result.retryAfter.toString());
  }

  return response;
}

/**
 * Create rate limit exceeded response
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please try again later.",
        retryAfter: result.retryAfter,
      },
    },
    { status: 429 }
  );

  return addRateLimitHeaders(response, result);
}

/**
 * Rate limit check result with ability to add headers
 */
export type RateLimitCheckResult =
  | { blocked: true; response: NextResponse }
  | { blocked: false; result: RateLimitResult; applyHeaders: (response: NextResponse) => NextResponse };

/**
 * Rate limiting middleware for API routes (enhanced version)
 * Returns rate limit info for adding headers to success responses
 *
 * Usage:
 * ```
 * const check = await rateLimitCheck(request, "api");
 * if (check.blocked) return check.response;
 * // ... handler logic
 * const response = NextResponse.json({ data });
 * return check.applyHeaders(response);
 * ```
 */
export async function rateLimitCheck(
  request: Request,
  type: RateLimitType
): Promise<RateLimitCheckResult> {
  const identifier = getClientIdentifier(request);
  const key = `${identifier.type}:${identifier.value}`;

  const result = await checkRateLimit(key, type);

  if (!result.success) {
    return { blocked: true, response: rateLimitExceededResponse(result) };
  }

  return {
    blocked: false,
    result,
    applyHeaders: (response: NextResponse) => addRateLimitHeaders(response, result),
  };
}

/**
 * Rate limiting middleware for API routes (legacy)
 * @deprecated Use rateLimitCheck() for proper header support
 *
 * Usage:
 * ```
 * const rateLimitResult = await rateLimit(request, "api");
 * if (rateLimitResult) return rateLimitResult;
 * // ... rest of handler
 * ```
 */
export async function rateLimit(
  request: Request,
  type: RateLimitType
): Promise<NextResponse | null> {
  const check = await rateLimitCheck(request, type);
  return check.blocked ? check.response : null;
}

/**
 * Wrapper to apply rate limiting and add headers to successful responses
 */
export async function withRateLimit<T>(
  request: Request,
  type: RateLimitType,
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  const identifier = getClientIdentifier(request);
  const key = `${identifier.type}:${identifier.value}`;

  const result = await checkRateLimit(key, type);

  if (!result.success) {
    return rateLimitExceededResponse(result) as NextResponse<T>;
  }

  const response = await handler();
  return addRateLimitHeaders(response, result) as NextResponse<T>;
}

/**
 * @deprecated Use getClientIdentifier() instead. Will be removed in next major version.
 */
export function getClientIP(request: Request): string {
  console.warn("getClientIP is deprecated. Use getClientIdentifier() instead.");
  return getClientIdentifier(request).value;
}
