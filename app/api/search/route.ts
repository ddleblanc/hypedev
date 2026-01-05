import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimitCheck } from '@/lib/rate-limit';
import { escapeLikePattern, sanitizeText } from '@/lib/sanitize';

// Schema for search request
const searchSchema = z.object({
  query: z.string().min(1).max(200),
  types: z.array(z.enum(['collection', 'nft', 'user'])).optional(),
  limit: z.number().int().positive().max(50).default(20),
  page: z.number().int().positive().default(1),
});

interface SearchResult {
  type: 'collection' | 'nft' | 'user';
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  address?: string;
  username?: string;
  floorPrice?: number | null;
  itemCount?: number;
  ownerCount?: number;
  isVerified?: boolean;
  isCreator?: boolean;
}

/**
 * GET /api/search
 * Global search across collections, NFTs, and users
 */
export async function GET(request: NextRequest) {
  // Rate limit search operations
  const rateLimit = await rateLimitCheck(request, 'search');
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query');
    const typesParam = searchParams.get('types');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const verifiedOnly = searchParams.get('verified') === 'true';

    if (!query || query.trim().length === 0) {
      return rateLimit.applyHeaders(NextResponse.json(
        { success: false, error: 'Search query is required' },
        { status: 400 }
      ));
    }

    const types: ('collection' | 'nft' | 'user')[] = typesParam
      ? (typesParam.split(',').filter((t) => ['collection', 'nft', 'user'].includes(t)) as any[])
      : ['collection', 'nft', 'user'];

    // Sanitize and escape search term to prevent SQL injection via LIKE patterns
    const rawSearchTerm = sanitizeText(query.trim()).toLowerCase();
    const searchTerm = escapeLikePattern(rawSearchTerm);
    const skip = (page - 1) * limit;

    // For single type search, use standard pagination
    // For multi-type search, fetch proportionally and combine
    const isSingleType = types.length === 1;

    // For multi-type: fetch more results per type, then trim at the end
    // This ensures we always have enough results to fill the limit
    const perTypeLimit = isSingleType ? limit : Math.ceil(limit / types.length) + 2;
    const perTypeSkip = isSingleType ? skip : 0;

    const results: SearchResult[] = [];
    const counts: Record<string, number> = {};

    // Search collections
    if (types.includes('collection')) {
      const collectionWhere = {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' as const } },
          { description: { contains: searchTerm, mode: 'insensitive' as const } },
          { address: { equals: searchTerm, mode: 'insensitive' as const } },
        ],
        isDeployed: true, // Only show deployed collections
        ...(verifiedOnly && { isVerified: true }),
      };

      const [collections, collectionCount] = await Promise.all([
        prisma.collection.findMany({
          where: collectionWhere,
          select: {
            id: true,
            name: true,
            image: true,
            description: true,
            address: true,
            floorPrice: true,
            isVerified: true,
            _count: {
              select: { nfts: true },
            },
          },
          take: perTypeLimit,
          skip: perTypeSkip,
          orderBy: [
            { isVerified: 'desc' },
            { floorPrice: 'desc' },
          ],
        }),
        prisma.collection.count({
          where: collectionWhere,
        }),
      ]);

      counts.collections = collectionCount;

      for (const collection of collections) {
        results.push({
          type: 'collection',
          id: collection.id,
          name: collection.name,
          image: collection.image,
          description: collection.description,
          address: collection.address || undefined,
          floorPrice: collection.floorPrice,
          itemCount: collection._count.nfts,
          isVerified: collection.isVerified,
        });
      }
    }

    // Search NFTs
    if (types.includes('nft')) {
      const nftWhere = {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' as const } },
          { description: { contains: searchTerm, mode: 'insensitive' as const } },
          { onChainTokenId: { equals: searchTerm } },
        ],
        collection: {
          isDeployed: true,
          ...(verifiedOnly && { isVerified: true }),
        },
      };

      const [nfts, nftCount] = await Promise.all([
        prisma.nft.findMany({
          where: nftWhere,
          select: {
            id: true,
            name: true,
            image: true,
            description: true,
            onChainTokenId: true,
            isListed: true,
            listingPrice: true,
            collection: {
              select: {
                id: true,
                name: true,
                address: true,
                isVerified: true,
              },
            },
          },
          take: perTypeLimit,
          skip: perTypeSkip,
          orderBy: [
            { isListed: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.nft.count({
          where: nftWhere,
        }),
      ]);

      counts.nfts = nftCount;

      for (const nft of nfts) {
        results.push({
          type: 'nft',
          id: nft.id,
          name: nft.name,
          image: nft.image,
          description: nft.description,
          address: nft.collection?.address || undefined,
          floorPrice: nft.listingPrice,
          isVerified: nft.collection?.isVerified,
        });
      }
    }

    // Search users
    if (types.includes('user')) {
      const userWhere = {
        OR: [
          { username: { contains: searchTerm, mode: 'insensitive' as const } },
          { walletAddress: { equals: searchTerm, mode: 'insensitive' as const } },
          { bio: { contains: searchTerm, mode: 'insensitive' as const } },
        ],
        // For users, verified means approved creator
        ...(verifiedOnly && { creatorApprovedAt: { not: null } }),
      };

      const [users, userCount] = await Promise.all([
        prisma.user.findMany({
          where: userWhere,
          select: {
            id: true,
            username: true,
            walletAddress: true,
            profilePicture: true,
            bio: true,
            isCreator: true,
            creatorApprovedAt: true,
            _count: {
              select: {
                projects: true,
              },
            },
          },
          take: perTypeLimit,
          skip: perTypeSkip,
          orderBy: [
            { isCreator: 'desc' },
            { createdAt: 'desc' },
          ],
        }),
        prisma.user.count({
          where: userWhere,
        }),
      ]);

      counts.users = userCount;

      for (const user of users) {
        results.push({
          type: 'user',
          id: user.id,
          name: user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`,
          image: user.profilePicture,
          description: user.bio,
          address: user.walletAddress,
          username: user.username || undefined,
          isCreator: user.isCreator,
          isVerified: user.creatorApprovedAt !== null,
          itemCount: user._count.projects,
        });
      }
    }

    // Sort combined results - prioritize verified/creator items
    results.sort((a, b) => {
      // Verified first
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      // Then by type order (collections, nfts, users)
      const typeOrder = { collection: 0, nft: 1, user: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    return rateLimit.applyHeaders(NextResponse.json({
      success: true,
      query: rawSearchTerm, // Return sanitized but un-escaped term for display
      results: results.slice(0, limit),
      counts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }));
  } catch (error) {
    console.error('Error performing search:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return rateLimit.applyHeaders(NextResponse.json(
      { success: false, error: `Search failed: ${errorMessage}` },
      { status: 500 }
    ));
  }
}

/**
 * POST /api/search
 * Advanced search with filters (for future use)
 */
export async function POST(request: NextRequest) {
  // Rate limit search operations
  const rateLimit = await rateLimitCheck(request, 'search');
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const body = await request.json();
    const validatedData = searchSchema.parse(body);

    // For now, redirect to GET logic with same parameters
    const url = new URL(request.url);
    url.searchParams.set('q', validatedData.query);
    if (validatedData.types) {
      url.searchParams.set('types', validatedData.types.join(','));
    }
    url.searchParams.set('limit', validatedData.limit.toString());
    url.searchParams.set('page', validatedData.page.toString());

    // Create a new request with the URL
    const getRequest = new NextRequest(url, { method: 'GET' });
    return GET(getRequest);
  } catch (error) {
    console.error('Error performing search:', error);

    if (error instanceof z.ZodError) {
      return rateLimit.applyHeaders(NextResponse.json(
        { success: false, error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      ));
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return rateLimit.applyHeaders(NextResponse.json(
      { success: false, error: `Search failed: ${errorMessage}` },
      { status: 500 }
    ));
  }
}
