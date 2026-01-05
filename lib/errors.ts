/**
 * Typed error hierarchy for the application
 * All errors should extend AppError for consistent handling
 */
import type { ZodError, ZodIssue } from "zod";

// Base error type
export interface AppError {
  code: string;
  message: string;
  cause?: unknown;
  statusCode: number;
}

// Validation errors (from Zod)
export interface ValidationError extends AppError {
  code: "VALIDATION_ERROR";
  statusCode: 400;
  issues: ZodIssue[];
}

export function validationError(zodError: ZodError): ValidationError {
  return {
    code: "VALIDATION_ERROR",
    message: "Validation failed",
    statusCode: 400,
    issues: zodError.issues,
    cause: zodError,
  };
}

// Not found errors
export interface NotFoundError extends AppError {
  code: "NOT_FOUND";
  statusCode: 404;
  resource: string;
  id?: string;
}

export function notFoundError(resource: string, id?: string): NotFoundError {
  return {
    code: "NOT_FOUND",
    message: id ? `${resource} with id ${id} not found` : `${resource} not found`,
    statusCode: 404,
    resource,
    id,
  };
}

// Unauthorized errors
export interface UnauthorizedError extends AppError {
  code: "UNAUTHORIZED";
  statusCode: 401;
}

export function unauthorizedError(message = "Unauthorized"): UnauthorizedError {
  return {
    code: "UNAUTHORIZED",
    message,
    statusCode: 401,
  };
}

// Forbidden errors
export interface ForbiddenError extends AppError {
  code: "FORBIDDEN";
  statusCode: 403;
}

export function forbiddenError(message = "Forbidden"): ForbiddenError {
  return {
    code: "FORBIDDEN",
    message,
    statusCode: 403,
  };
}

// Database errors
export interface DatabaseError extends AppError {
  code: "DATABASE_ERROR";
  statusCode: 500;
}

/**
 * Create a database error.
 * In production, the cause is sanitized to prevent leaking internal details.
 * In development, the full cause is preserved for debugging.
 */
export function databaseError(cause: unknown): DatabaseError {
  const isProduction = process.env.NODE_ENV === "production";

  // In production, sanitize the cause to prevent leaking internal details
  const sanitizedCause = isProduction
    ? sanitizeDatabaseCause(cause)
    : cause;

  return {
    code: "DATABASE_ERROR",
    message: "Database operation failed",
    statusCode: 500,
    cause: sanitizedCause,
  };
}

/**
 * Sanitize error cause for production.
 * Extracts only safe, non-sensitive information.
 */
function sanitizeErrorCause(cause: unknown): { type: string; code?: string } | undefined {
  if (!cause) return undefined;

  if (cause instanceof Error) {
    // Extract error code if available (Prisma, etc.)
    const errorCode = (cause as { code?: string }).code;

    if (errorCode) {
      return {
        type: cause.name || "Error",
        code: errorCode,
      };
    }

    // Generic error type without sensitive details
    return { type: cause.name || "Error" };
  }

  return { type: "unknown" };
}

/**
 * Sanitize database error cause for production.
 * Extracts only safe, non-sensitive information.
 */
function sanitizeDatabaseCause(cause: unknown): { type: string; code?: string } | undefined {
  if (!cause) return undefined;

  if (cause instanceof Error) {
    // Extract Prisma error code if available (e.g., P2002 for unique constraint)
    const prismaCode = (cause as { code?: string }).code;

    // Map common Prisma error codes to user-friendly messages
    if (prismaCode) {
      return {
        type: "prisma",
        code: prismaCode,
      };
    }

    // Generic error type without sensitive details
    return { type: cause.name || "Error" };
  }

  return { type: "unknown" };
}

// Blockchain errors
export interface BlockchainError extends AppError {
  code: "BLOCKCHAIN_ERROR";
  statusCode: 500;
  txHash?: string;
}

/**
 * Create a blockchain error.
 * In production, the cause is sanitized to prevent leaking internal details.
 */
export function blockchainError(
  message: string,
  cause?: unknown,
  txHash?: string
): BlockchainError {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    code: "BLOCKCHAIN_ERROR",
    message,
    statusCode: 500,
    cause: isProduction ? sanitizeErrorCause(cause) : cause,
    txHash,
  };
}

// Rate limit errors
export interface RateLimitError extends AppError {
  code: "RATE_LIMIT";
  statusCode: 429;
  retryAfter: number;
}

export function rateLimitError(retryAfter: number): RateLimitError {
  return {
    code: "RATE_LIMIT",
    message: "Too many requests",
    statusCode: 429,
    retryAfter,
  };
}

// Bad request errors (non-validation input errors)
export interface BadRequestError extends AppError {
  code: "BAD_REQUEST";
  statusCode: 400;
}

export function badRequestError(message: string): BadRequestError {
  return {
    code: "BAD_REQUEST",
    message,
    statusCode: 400,
  };
}

// Conflict errors (duplicate, already exists, etc.)
export interface ConflictError extends AppError {
  code: "CONFLICT";
  statusCode: 409;
}

export function conflictError(message: string): ConflictError {
  return {
    code: "CONFLICT",
    message,
    statusCode: 409,
  };
}

// Internal errors (catch-all)
export interface InternalError extends AppError {
  code: "INTERNAL_ERROR";
  statusCode: 500;
}

/**
 * Create an internal error.
 * In production, the cause is sanitized to prevent leaking internal details.
 */
export function internalError(message: string, cause?: unknown): InternalError {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    code: "INTERNAL_ERROR",
    message,
    statusCode: 500,
    cause: isProduction ? sanitizeErrorCause(cause) : cause,
  };
}

// Union type for all errors
export type AnyAppError =
  | ValidationError
  | NotFoundError
  | UnauthorizedError
  | ForbiddenError
  | DatabaseError
  | BlockchainError
  | RateLimitError
  | BadRequestError
  | ConflictError
  | InternalError;

// Type guard
export function isAppError(e: unknown): e is AppError {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    "message" in e &&
    "statusCode" in e
  );
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(e: unknown): InternalError {
  if (isAppError(e)) {
    return {
      code: "INTERNAL_ERROR",
      message: e.message,
      statusCode: 500,
      cause: e,
    };
  }

  if (e instanceof Error) {
    return internalError(e.message, e);
  }

  return internalError("An unexpected error occurred", e);
}
