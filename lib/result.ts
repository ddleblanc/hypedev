/**
 * Result pattern utilities using neverthrow
 * Provides consistent error handling across the codebase
 */
import { Result, ok, err, ResultAsync } from "neverthrow";
import type { AppError } from "./errors";

// Re-export for convenience
export { Result, ok, err, ResultAsync };

// Type alias for common patterns
export type AsyncResult<T, E = AppError> = ResultAsync<T, E>;

/**
 * Wrap a promise in ResultAsync
 */
export function fromPromise<T, E = AppError>(
  promise: Promise<T>,
  errorFn: (e: unknown) => E
): ResultAsync<T, E> {
  return ResultAsync.fromPromise(promise, errorFn);
}

/**
 * Wrap a synchronous function that might throw
 */
export function tryCatch<T, E = AppError>(
  fn: () => T,
  errorFn: (e: unknown) => E
): Result<T, E> {
  try {
    return ok(fn());
  } catch (e) {
    return err(errorFn(e));
  }
}

/**
 * Combine multiple Results, returning first error or all successes
 */
export function combineResults<T, E>(
  results: Result<T, E>[]
): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (result.isErr()) {
      return err(result.error);
    }
    values.push(result.value);
  }
  return ok(values);
}

/**
 * Combine multiple ResultAsync, returning first error or all successes
 */
export function combineResultsAsync<T, E>(
  results: ResultAsync<T, E>[]
): ResultAsync<T[], E> {
  return ResultAsync.combine(results);
}
