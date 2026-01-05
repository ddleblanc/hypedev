/**
 * superjson configuration for lossless serialization
 *
 * Handles BigInt, Date, Map, Set, undefined, and other JS types
 * that JSON.stringify/parse would otherwise lose or corrupt.
 */

import SuperJSON from "superjson";

// Register BigInt transformer (superjson handles this by default, but explicit is better)
SuperJSON.registerCustom<bigint, string>(
  {
    isApplicable: (v): v is bigint => typeof v === "bigint",
    serialize: (v) => v.toString(),
    deserialize: (v) => BigInt(v),
  },
  "bigint"
);

// Export configured instance
export const superjson = SuperJSON;

// Convenience exports
export const { stringify, parse, serialize, deserialize } = SuperJSON;

/**
 * Safe JSON body parser for API routes that handles BigInt
 * Use this when receiving JSON that may contain BigInt values
 */
export function parseJsonBody<T>(body: string): T {
  return SuperJSON.parse<T>(body);
}

/**
 * Safe JSON stringifier for API responses
 * Use this when sending JSON that may contain BigInt/Date values
 */
export function stringifyJson<T>(data: T): string {
  return SuperJSON.stringify(data);
}

/**
 * Transform object for client-server boundary
 * Returns { json, meta } where meta contains type information
 */
export function serializeForTransport<T>(data: T) {
  return SuperJSON.serialize(data);
}

/**
 * Reconstruct object from transport format
 */
export function deserializeFromTransport<T>(data: { json: unknown; meta?: unknown }): T {
  return SuperJSON.deserialize<T>(data as ReturnType<typeof SuperJSON.serialize>);
}
