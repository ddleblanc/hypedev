import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimitCheck } from '@/lib/rate-limit';
import { escapeLikePattern, sanitizeText } from '@/lib/sanitize';

// GET - Fetch trending and popular search suggestions, or typeahead results
export async function GET(request: NextRequest) {
  // Rate limit search operations
  const rateLimit = await rateLimitCheck(request, 'search');
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    // If query provided, return typeahead suggestions from SearchIndex
    if (query && query.length >= 2) {
      const sanitizedQuery = sanitizeText(query).toLowerCase();
      const escapedQuery = escapeLikePattern(sanitizedQuery);

      // Try SearchIndex first (faster if populated)
      const indexResults = await prisma.searchIndex.findMany({
        where: {
          OR: [
            { title: { startsWith: escapedQuery, mode: 'insensitive' } },
            { title: { contains: escapedQuery, mode: 'insensitive' } },
            { searchVector: { contains: sanitizedQuery } },
          ],
        },
        orderBy: [
          { entityType: 'asc' }, // Collections first
        ],
        take: limit,
        select: {
          entityType: true,
          entityId: true,
          title: true,
          description: true,
          collectionId: true,
          creatorAddress: true,
        },
      });

      // If we have index results, use them
      if (indexResults.length > 0) {
        // Fetch additional metadata for each result type
        const collectionIds = indexResults
          .filter((r) => r.entityType === 'collection')
          .map((r) => r.entityId);
        const userIds = indexResults
          .filter((r) => r.entityType === 'user')
          .map((r) => r.entityId);

        const [collections, users] = await Promise.all([
          collectionIds.length > 0
            ? prisma.collection.findMany({
                where: { id: { in: collectionIds } },
                select: {
                  id: true,
                  slug: true,
                  address: true,
                  image: true,
                  isVerified: true,
                },
              })
            : Promise.resolve([]),
          userIds.length > 0
            ? prisma.user.findMany({
                where: { id: { in: userIds } },
                select: {
                  id: true,
                  walletAddress: true,
                  profilePicture: true,
                  isCreator: true,
                },
              })
            : Promise.resolve([]),
        ]);

        const collectionMap = new Map(collections.map((c) => [c.id, c]));
        const userMap = new Map(users.map((u) => [u.id, u]));

        const suggestions = indexResults.map((r) => {
          const base = {
            id: r.entityId,
            name: r.title,
            type: r.entityType,
          };

          if (r.entityType === 'collection') {
            const c = collectionMap.get(r.entityId);
            return {
              ...base,
              slug: c?.slug,
              address: c?.address,
              image: c?.image,
              isVerified: c?.isVerified || false,
            };
          }

          if (r.entityType === 'user') {
            const u = userMap.get(r.entityId);
            return {
              ...base,
              address: u?.walletAddress,
              image: u?.profilePicture,
              isCreator: u?.isCreator || false,
            };
          }

          // NFT - use collectionId for image lookup if needed
          return {
            ...base,
            collectionId: r.collectionId,
          };
        });

        return rateLimit.applyHeaders(
          NextResponse.json({
            success: true,
            suggestions,
            type: 'typeahead',
          })
        );
      }

      // Fallback to direct queries if SearchIndex is empty
      const [collections, users] = await Promise.all([
        prisma.collection.findMany({
          where: {
            isDeployed: true,
            OR: [
              { name: { startsWith: escapedQuery, mode: 'insensitive' } },
              { name: { contains: escapedQuery, mode: 'insensitive' } },
            ],
          },
          take: Math.ceil(limit / 2),
          select: {
            id: true,
            slug: true,
            address: true,
            name: true,
            image: true,
            isVerified: true,
          },
        }),
        prisma.user.findMany({
          where: {
            OR: [
              { username: { startsWith: escapedQuery, mode: 'insensitive' } },
              { username: { contains: escapedQuery, mode: 'insensitive' } },
            ],
          },
          take: Math.ceil(limit / 2),
          select: {
            id: true,
            username: true,
            walletAddress: true,
            profilePicture: true,
            isCreator: true,
          },
        }),
      ]);

      const suggestions = [
        ...collections.map((c) => ({
          id: c.id,
          name: c.name,
          type: 'collection' as const,
          slug: c.slug,
          address: c.address,
          image: c.image,
          isVerified: c.isVerified,
        })),
        ...users.map((u) => ({
          id: u.id,
          name: u.username || `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}`,
          type: 'user' as const,
          address: u.walletAddress,
          image: u.profilePicture,
          isCreator: u.isCreator,
        })),
      ].slice(0, limit);

      return rateLimit.applyHeaders(
        NextResponse.json({
          success: true,
          suggestions,
          type: 'typeahead',
        })
      );
    }

    // No query - return trending and popular suggestions
    const [trendingSuggestions, popularCollections] = await Promise.all([
      prisma.globalSuggestion.findMany({
        where: {
          category: 'search',
          OR: [{ trending: true }, { usage: { gte: 5 } }],
        },
        orderBy: [{ trending: 'desc' }, { usage: 'desc' }, { updatedAt: 'desc' }],
        take: limit,
        select: {
          id: true,
          value: true,
          usage: true,
          trending: true,
        },
      }),
      prisma.collection.findMany({
        where: { isDeployed: true },
        orderBy: [{ floorPrice: 'desc' }],
        take: 4,
        select: {
          id: true,
          slug: true,
          address: true,
          name: true,
          image: true,
          isVerified: true,
        },
      }),
    ]);

    return rateLimit.applyHeaders(
      NextResponse.json({
        success: true,
        trending: trendingSuggestions.map((s) => ({
          id: s.id,
          query: s.value,
          isTrending: s.trending,
          searchCount: s.usage,
        })),
        popularCollections: popularCollections.map((c) => ({
          id: c.id,
          slug: c.slug,
          address: c.address,
          name: c.name,
          image: c.image,
          isVerified: c.isVerified,
          type: 'collection' as const,
        })),
      })
    );
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return rateLimit.applyHeaders(
      NextResponse.json({ success: false, error: 'Failed to fetch suggestions' }, { status: 500 })
    );
  }
}
