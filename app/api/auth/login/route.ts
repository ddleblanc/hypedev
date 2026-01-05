import { NextRequest } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { generateLoginPayload, verifyLoginPayload, LoginPayload } from "@/lib/thirdweb-auth";
import { auth } from "@/lib/auth";
import { rateLimitCheck } from "@/lib/rate-limit";
import { ResultAsync, ok, err } from "@/lib/result";
import { resultToResponse, resultToResponseWithRateLimit } from "@/lib/api-utils";
import {
  validationError,
  unauthorizedError,
  internalError,
  badRequestError,
  type AnyAppError,
} from "@/lib/errors";
import { AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS } from "@/lib/constants/auth";

// Zod schemas for validation
const GetLoginPayloadSchema = z.object({
  address: z.string().min(1),
});

const VerifyLoginSchema = z.object({
  payload: z.object({
    domain: z.string(),
    address: z.string(),
    statement: z.string().optional(),
    uri: z.string().optional(),
    version: z.string().optional(),
    chain_id: z.string().optional(),
    nonce: z.string().optional(),
    issued_at: z.string().optional(),
    expiration_time: z.string().optional(),
    invalid_before: z.string().optional(),
  }),
  signature: z.string().min(1),
});

/**
 * GET /api/auth/login?address=0x...
 * Generate a login payload for the wallet to sign
 */
export async function GET(request: NextRequest) {
  // Rate limit by IP
  const rateLimit = await rateLimitCheck(request, "loginPayload");
  if (rateLimit.blocked) return rateLimit.response;

  // Validate query parameters
  const parseResult = GetLoginPayloadSchema.safeParse({
    address: request.nextUrl.searchParams.get("address"),
  });

  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimit);
  }

  const { address } = parseResult.data;

  // Generate login payload
  const payloadResult = await ResultAsync.fromPromise(
    generateLoginPayload(address),
    (e) => internalError("Failed to generate login payload", e)
  );

  return resultToResponseWithRateLimit(payloadResult.map((payload) => ({ payload })), rateLimit);
}

/**
 * POST /api/auth/login
 * Verify the signed payload and create session
 */
export async function POST(request: NextRequest) {
  // Rate limit by IP (stricter for verification)
  const rateLimit = await rateLimitCheck(request, "loginVerify");
  if (rateLimit.blocked) return rateLimit.response;

  // Parse JSON body
  const bodyResult = await ResultAsync.fromPromise(
    request.json() as Promise<unknown>,
    () => badRequestError("Invalid JSON body")
  );

  if (bodyResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(bodyResult.error), rateLimit);
  }

  // Validate input
  const parseResult = VerifyLoginSchema.safeParse(bodyResult.value);
  if (!parseResult.success) {
    return resultToResponseWithRateLimit(err(validationError(parseResult.error)), rateLimit);
  }

  const { payload, signature } = parseResult.data;

  // Verify the signature
  const verifyResult = await ResultAsync.fromPromise(
    verifyLoginPayload(payload as LoginPayload, signature),
    (e) => internalError("Failed to verify login", e)
  );

  if (verifyResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(verifyResult.error), rateLimit);
  }

  const result = verifyResult.value;
  if (!result.valid) {
    return resultToResponseWithRateLimit(err(unauthorizedError("Invalid signature")), rateLimit);
  }

  // Find or create user
  const userResult = await ResultAsync.fromPromise(
    auth.findOrCreateUser(result.address),
    (e) => internalError("Failed to create user session", e)
  );

  if (userResult.isErr()) {
    return resultToResponseWithRateLimit(err<never, AnyAppError>(userResult.error), rateLimit);
  }

  const user = userResult.value;

  // Set the JWT cookie
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, result.jwt, AUTH_COOKIE_OPTIONS);

  return resultToResponseWithRateLimit(
    ok({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        profileCompleted: user.profileCompleted,
        isCreator: user.isCreator,
        profilePicture: user.profilePicture,
      },
      requiresOnboarding: !user.profileCompleted,
      isNewUser: user.isNewUser,
      ...(user.emailWarning && { warning: user.emailWarning }),
    }),
    rateLimit
  );
}
