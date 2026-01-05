/**
 * Centralized authentication constants
 * All auth-related files MUST import from here
 */

/**
 * Cookie name for JWT storage
 * Uses __Host- prefix in production for enhanced security
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#cookie_prefixes
 */
export const AUTH_COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-hpx_auth"
    : "hpx_auth";

/**
 * JWT validity duration in seconds
 * Default: 7 days
 * Note: Tokens should be refreshed before expiry (see Phase 5)
 */
export const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Cookie options for auth token
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: AUTH_TOKEN_MAX_AGE,
};

/**
 * Time before expiry to trigger refresh (in seconds)
 * Default: 24 hours - refresh when less than 24 hours remain on a 7-day token
 */
export const AUTH_REFRESH_THRESHOLD = 60 * 60 * 24; // 24 hours

/**
 * Interval for checking token expiry (in milliseconds)
 * Default: 5 minutes
 */
export const AUTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Minimum time between refresh attempts (in milliseconds)
 * Prevents rapid-fire refreshes
 */
export const AUTH_MIN_REFRESH_INTERVAL = 60 * 1000; // 1 minute

/**
 * Rate limiting keys for auth operations
 */
export const AUTH_RATE_LIMIT_KEYS = {
  LOGIN_PAYLOAD: "loginPayload",
  LOGIN_VERIFY: "loginVerify",
  AUTH: "auth",
} as const;
