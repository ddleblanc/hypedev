/**
 * API response utilities for consistent error handling
 */
import { NextResponse } from "next/server";
import type { Result } from "neverthrow";
import { match } from "ts-pattern";
import * as Sentry from "@sentry/nextjs";
import type { AnyAppError } from "./errors";
import type { RateLimitCheckResult } from "./rate-limit";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Convert a Result to a NextResponse
 */
export function resultToResponse<T>(
  result: Result<T, AnyAppError>
): NextResponse<ApiResponse<T>> {
  return result.match(
    (data) =>
      NextResponse.json({ success: true, data } as ApiResponse<T>),
    (error) => {
      // Capture server errors to Sentry (5xx)
      if (error.statusCode >= 500) {
        Sentry.captureException(new Error(error.message), {
          tags: {
            errorCode: error.code,
          },
          extra: {
            errorDetails: match(error)
              .with({ code: "DATABASE_ERROR" }, (e) => e.cause)
              .with({ code: "BLOCKCHAIN_ERROR" }, (e) => ({ txHash: e.txHash, cause: e.cause }))
              .with({ code: "INTERNAL_ERROR" }, (e) => e.cause)
              .otherwise(() => undefined),
          },
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: match(error)
              .with({ code: "VALIDATION_ERROR" }, (e) => e.issues)
              .with({ code: "RATE_LIMIT" }, (e) => ({ retryAfter: e.retryAfter }))
              .with({ code: "NOT_FOUND" }, (e) => ({ resource: e.resource, id: e.id }))
              .otherwise(() => undefined),
          },
        } as ApiResponse<T>,
        { status: error.statusCode }
      );
    }
  );
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data });
}

/**
 * Create an error response from an AppError
 */
export function errorResponse(error: AnyAppError): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: match(error)
          .with({ code: "VALIDATION_ERROR" }, (e) => e.issues)
          .with({ code: "RATE_LIMIT" }, (e) => ({ retryAfter: e.retryAfter }))
          .with({ code: "NOT_FOUND" }, (e) => ({ resource: e.resource, id: e.id }))
          .otherwise(() => undefined),
      },
    },
    { status: error.statusCode }
  );
}

/**
 * Extract and validate wallet address from request
 * Uses proper JWT verification for Bearer tokens
 */
export async function getWalletFromRequest(request: Request): Promise<string | null> {
  // Check Authorization header first
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    // Import dynamically to avoid circular dependencies
    const { verifyBearerAuth } = await import("./thirdweb-auth");
    const result = await verifyBearerAuth(authHeader);
    if (result.valid && result.address) {
      return result.address.toLowerCase();
    }
    return null;
  }

  // Check X-Wallet-Address header (development only)
  if (process.env.NODE_ENV !== "production") {
    const walletHeader = request.headers.get("X-Wallet-Address");
    if (walletHeader) {
      return walletHeader.toLowerCase();
    }
  }

  return null;
}

/**
 * Parse JSON body from request with error handling
 */
export async function parseJsonBody<T>(
  request: Request
): Promise<{ data: T } | { error: string }> {
  try {
    const data = await request.json();
    return { data: data as T };
  } catch {
    return { error: "Invalid JSON body" };
  }
}

/**
 * Convert a Result to a NextResponse with rate limit headers
 */
export function resultToResponseWithRateLimit<T>(
  result: Result<T, AnyAppError>,
  rateLimitCheck: RateLimitCheckResult
): NextResponse<ApiResponse<T>> {
  const response = resultToResponse(result);
  if (!rateLimitCheck.blocked) {
    return rateLimitCheck.applyHeaders(response) as NextResponse<ApiResponse<T>>;
  }
  return response;
}
