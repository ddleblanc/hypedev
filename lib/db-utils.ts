/**
 * Database query optimization utilities
 * Provides batch fetching and cursor-based pagination to avoid N+1 queries
 */
import { prisma } from "./prisma";

/**
 * Type definitions for batch fetched entities
 */
export interface UserSelectType {
  id: string;
  username: string | null;
  profilePicture: string | null;
  walletAddress: string;
  isCreator: boolean;
}

export interface CollectionSelectType {
  id: string;
  name: string;
  image: string | null;
  address: string;
  floorPrice: number | null;
}

export interface NftSelectType {
  id: string;
  name: string;
  image: string;
  tokenId: string;
  collection: {
    id: string;
    name: string;
    address: string;
  };
}

/**
 * Batch fetch users to avoid N+1 queries
 * Returns a Map for O(1) lookup by user ID
 */
export async function batchFetchUsers(ids: string[]): Promise<Map<string, UserSelectType>> {
  if (ids.length === 0) return new Map<string, UserSelectType>();

  const uniqueIds = [...new Set(ids)];
  const users = await prisma.user.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      username: true,
      profilePicture: true,
      walletAddress: true,
      isCreator: true,
    },
  });

  return new Map(users.map((u) => [u.id, u]));
}

/**
 * Batch fetch users by wallet address
 */
export async function batchFetchUsersByAddress(addresses: string[]): Promise<Map<string, UserSelectType>> {
  if (addresses.length === 0) return new Map<string, UserSelectType>();

  const uniqueAddresses = [...new Set(addresses.map((a) => a.toLowerCase()))];
  const users = await prisma.user.findMany({
    where: { walletAddress: { in: uniqueAddresses, mode: "insensitive" } },
    select: {
      id: true,
      username: true,
      profilePicture: true,
      walletAddress: true,
      isCreator: true,
    },
  });

  return new Map(users.map((u) => [u.walletAddress.toLowerCase(), u]));
}

/**
 * Batch fetch collections by ID
 */
export async function batchFetchCollections(ids: string[]): Promise<Map<string, CollectionSelectType>> {
  if (ids.length === 0) return new Map<string, CollectionSelectType>();

  const uniqueIds = [...new Set(ids)];
  const collections = await prisma.collection.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      name: true,
      image: true,
      address: true,
      floorPrice: true,
    },
  });

  return new Map(collections.map((c) => [c.id, c]));
}

/**
 * Batch fetch NFTs by ID
 */
export async function batchFetchNfts(ids: string[]): Promise<Map<string, NftSelectType>> {
  if (ids.length === 0) return new Map<string, NftSelectType>();

  const uniqueIds = [...new Set(ids)];
  const nfts = await prisma.nft.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      name: true,
      image: true,
      tokenId: true,
      collection: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  return new Map(nfts.map((n) => [n.id, n]));
}

/**
 * Cursor-based pagination parameters
 */
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

/**
 * Cursor-based pagination result
 */
export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Generic cursor-based pagination helper
 * Fetches one extra item to determine if there are more results
 */
export async function paginateWithCursor<T extends { id: string }>(
  query: (params: { cursor?: { id: string }; take: number; skip?: number }) => Promise<T[]>,
  params: CursorPaginationParams
): Promise<CursorPaginationResult<T>> {
  const { cursor, limit } = params;

  const items = await query({
    cursor: cursor ? { id: cursor } : undefined,
    take: limit + 1, // Fetch one extra to check for more
    skip: cursor ? 1 : 0, // Skip the cursor item when paginating
  });

  const hasMore = items.length > limit;
  const trimmedItems = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore && trimmedItems.length > 0 ? trimmedItems[trimmedItems.length - 1].id : null;

  return {
    items: trimmedItems,
    nextCursor,
    hasMore,
  };
}

/**
 * Offset-based pagination parameters (for simpler cases)
 */
export interface OffsetPaginationParams {
  page: number;
  limit: number;
}

/**
 * Offset-based pagination result
 */
export interface OffsetPaginationResult<T> {
  items: T[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Offset-based pagination helper
 * Better for cases where users need to jump to specific pages
 */
export async function paginateWithOffset<T>(
  query: (params: { skip: number; take: number }) => Promise<T[]>,
  countQuery: () => Promise<number>,
  params: OffsetPaginationParams
): Promise<OffsetPaginationResult<T>> {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const [items, totalCount] = await Promise.all([query({ skip, take: limit }), countQuery()]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    items,
    page,
    limit,
    totalCount,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Helper to build where clause for search with escaped patterns
 */
export function buildSearchWhere(searchTerm: string, fields: string[]): Record<string, unknown> {
  // Escape special characters for LIKE patterns
  const escapedTerm = searchTerm.replace(/[%_\\]/g, "\\$&");

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: escapedTerm,
        mode: "insensitive",
      },
    })),
  };
}

/**
 * Transaction wrapper with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on non-retryable errors
      const errorMessage = lastError.message.toLowerCase();
      if (
        errorMessage.includes("unique constraint") ||
        errorMessage.includes("foreign key constraint") ||
        errorMessage.includes("not found")
      ) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }

  throw lastError;
}

/**
 * Prisma transaction options for consistent usage
 */
export const TRANSACTION_OPTIONS = {
  maxWait: 5000, // Maximum time to wait for a connection
  timeout: 10000, // Maximum time for the transaction to complete
  isolationLevel: "Serializable" as const,
};

/**
 * Helper to create a select object for common NFT queries
 */
export const NFT_SELECT = {
  id: true,
  name: true,
  image: true,
  tokenId: true,
  description: true,
  rarityTier: true,
  collection: {
    select: {
      id: true,
      name: true,
      address: true,
      image: true,
    },
  },
} as const;

/**
 * Helper to create a select object for common user queries
 */
export const USER_SELECT = {
  id: true,
  username: true,
  walletAddress: true,
  profilePicture: true,
  isCreator: true,
  bio: true,
} as const;
