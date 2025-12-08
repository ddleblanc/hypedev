import { createThirdwebClient } from "thirdweb";
import { createAuth } from "thirdweb/auth";
import { privateKeyToAccount } from "thirdweb/wallets";
import { cookies } from "next/headers";

// Validate required environment variables at module load
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY;
const AUTH_ADMIN_PRIVATE_KEY = process.env.AUTH_ADMIN_PRIVATE_KEY;

if (!THIRDWEB_SECRET_KEY) {
  throw new Error("CRITICAL: THIRDWEB_SECRET_KEY environment variable is not set");
}

if (!AUTH_ADMIN_PRIVATE_KEY) {
  throw new Error("CRITICAL: AUTH_ADMIN_PRIVATE_KEY environment variable is not set");
}

// Server-side Thirdweb client with secret key
const serverClient = createThirdwebClient({
  secretKey: THIRDWEB_SECRET_KEY,
});

// Admin account for signing JWTs (doesn't need funds)
const adminAccount = privateKeyToAccount({
  client: serverClient,
  privateKey: AUTH_ADMIN_PRIVATE_KEY,
});

// Create auth instance for server-side operations
export const thirdwebAuth = createAuth({
  domain: process.env.NEXT_PUBLIC_APP_URL || "localhost:3000",
  client: serverClient,
  adminAccount,
});

// Cookie name for JWT storage (__Host- prefix in production for enhanced security)
const AUTH_COOKIE_NAME = process.env.NODE_ENV === "production"
  ? "__Host-tw_auth_token"
  : "tw_auth_token";

/**
 * Login payload type - using Thirdweb's internal types via inference
 */
export type LoginPayload = Awaited<ReturnType<typeof thirdwebAuth.generatePayload>>;

/**
 * Generate a login payload for a wallet address
 * Called when user initiates login
 */
export async function generateLoginPayload(address: string) {
  return thirdwebAuth.generatePayload({ address: address.toLowerCase() });
}

/**
 * Verify the signed payload and generate a JWT
 * Called after user signs the message
 */
export async function verifyLoginPayload(payload: LoginPayload, signature: string) {
  const verifiedPayload = await thirdwebAuth.verifyPayload({
    payload,
    signature,
  });

  if (!verifiedPayload.valid) {
    throw new Error("Invalid signature");
  }

  // Generate JWT token
  const jwt = await thirdwebAuth.generateJWT({
    payload: verifiedPayload.payload,
  });

  return {
    valid: verifiedPayload.valid,
    jwt,
    address: verifiedPayload.payload.address.toLowerCase()
  };
}

/**
 * Verify a JWT token and return the wallet address
 * Use this in API routes to authenticate requests
 */
export async function verifyJWT(jwt: string): Promise<{ valid: boolean; address?: string }> {
  try {
    const result = await thirdwebAuth.verifyJWT({ jwt });
    if (result.valid) {
      return {
        valid: true,
        address: result.parsedJWT.sub?.toLowerCase() // subject is the wallet address, normalized
      };
    }
    return { valid: false };
  } catch (error) {
    // Only log the error message, not the full error (which may contain the JWT)
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("JWT verification error:", message);
    return { valid: false };
  }
}

/**
 * Get the authenticated wallet address from request cookies
 * Returns null if not authenticated
 */
export async function getAuthenticatedAddress(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const result = await verifyJWT(token);
    return result.valid ? result.address || null : null;
  } catch (error) {
    // Only log the error message, not the full error
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error getting authenticated address:", message);
    return null;
  }
}

/**
 * Verify that the request is from the claimed wallet address
 * Use this in API routes that accept a walletAddress in the body
 */
export async function verifyRequestAuth(claimedAddress: string): Promise<boolean> {
  const authenticatedAddress = await getAuthenticatedAddress();

  if (!authenticatedAddress) {
    return false;
  }

  return authenticatedAddress.toLowerCase() === claimedAddress.toLowerCase();
}

/**
 * Helper to get auth token from Authorization header
 * For API routes that use Bearer token instead of cookies
 */
export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Verify request from Authorization header
 */
export async function verifyBearerAuth(authHeader: string | null): Promise<{ valid: boolean; address?: string }> {
  const token = getTokenFromHeader(authHeader);
  if (!token) {
    return { valid: false };
  }
  return verifyJWT(token);
}

/**
 * Middleware helper for API routes that require authentication
 * Returns the authenticated address or throws an error response
 */
export async function requireAuth(): Promise<string> {
  const address = await getAuthenticatedAddress();
  if (!address) {
    throw new AuthError("Authentication required", 401);
  }
  return address;
}

/**
 * Verify that the authenticated user matches the claimed address
 * Use in routes where users can only modify their own data
 */
export async function requireAuthMatch(claimedAddress: string): Promise<string> {
  const address = await requireAuth();
  if (address.toLowerCase() !== claimedAddress.toLowerCase()) {
    throw new AuthError("You can only perform this action for your own account", 403);
  }
  return address;
}

/**
 * Custom error class for auth errors
 */
export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
