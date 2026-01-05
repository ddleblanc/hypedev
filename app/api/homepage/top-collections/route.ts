import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { TopCollectionRow } from '@/types/homepage';
import { rateLimit } from '@/lib/rate-limit';

// Simple in-memory cache with timeframe support
const collectionsCache: Map<string, { data: TopCollectionRow[]; timestamp: number }> = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

type Timeframe = '24h' | '7d' | '30d';

function getTimeframeMs(timeframe: Timeframe): number {
  switch (timeframe) {
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '0';
  return price.toFixed(4).replace(/\.?0+$/, '');
}

function calculatePercentChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'api');
  if (rateLimitResult) return rateLimitResult;

  try {
    // Get timeframe from query params
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') || '24h') as Timeframe;
    const validTimeframes = ['24h', '7d', '30d'];
    const normalizedTimeframe = validTimeframes.includes(timeframe) ? timeframe : '24h';

    // Check cache for this timeframe
    const cacheKey = `top-collections-${normalizedTimeframe}`;
    const cached = collectionsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ success: true, collections: cached.data, timeframe: normalizedTimeframe });
    }

    const now = new Date();
    const timeframeMs = getTimeframeMs(normalizedTimeframe);
    const periodStart = new Date(now.getTime() - timeframeMs);
    const previousPeriodStart = new Date(now.getTime() - timeframeMs * 2);

    // Fetch all deployed collections (no pre-sorting - we'll sort by volume later)
    const collections = await prisma.collection.findMany({
      where: { isDeployed: true },
      select: {
        id: true,
        slug: true,
        name: true,
        image: true,
        floorPrice: true,
        isVerified: true,
        creatorAddress: true,
      },
      take: 50, // Get enough to find top 10 by volume
    });

    if (collections.length === 0) {
      return NextResponse.json({ success: true, collections: [] });
    }

    // Get volume data for collections in parallel
    const collectionIds = collections.map(c => c.id);

    const [volumeByCollection, volumePrevByCollection, salesByCollection, ownersByCollection] = await Promise.all([
      // Volume in current period grouped by collection
      prisma.activity.groupBy({
        by: ['collectionId'],
        where: {
          collectionId: { in: collectionIds },
          type: { in: ['purchase', 'listing_sold', 'auction_won', 'offer_accepted'] },
          amount: { not: null },
          createdAt: { gte: periodStart },
        },
        _sum: { amount: true },
      }),
      // Volume in previous period grouped by collection
      prisma.activity.groupBy({
        by: ['collectionId'],
        where: {
          collectionId: { in: collectionIds },
          type: { in: ['purchase', 'listing_sold', 'auction_won', 'offer_accepted'] },
          amount: { not: null },
          createdAt: { gte: previousPeriodStart, lt: periodStart },
        },
        _sum: { amount: true },
      }),
      // Sales count in current period
      prisma.activity.groupBy({
        by: ['collectionId'],
        where: {
          collectionId: { in: collectionIds },
          type: { in: ['purchase', 'listing_sold', 'auction_won', 'offer_accepted'] },
          createdAt: { gte: periodStart },
        },
        _count: { id: true },
      }),
      // Unique owners per collection
      prisma.nft.groupBy({
        by: ['collectionId'],
        where: {
          collectionId: { in: collectionIds },
          ownerAddress: { not: null },
        },
        _count: { ownerAddress: true },
      }),
    ]);

    // Create lookup maps
    const volumeMap = new Map(
      volumeByCollection.map(v => [v.collectionId, v._sum.amount || 0])
    );
    const volumePrevMap = new Map(
      volumePrevByCollection.map(v => [v.collectionId, v._sum.amount || 0])
    );
    const salesMap = new Map(
      salesByCollection.map(s => [s.collectionId, s._count.id])
    );
    const ownersMap = new Map(
      ownersByCollection.map(o => [o.collectionId, o._count.ownerAddress])
    );

    // Transform and sort by volume
    const topCollections: TopCollectionRow[] = collections
      .map((c, index) => {
        const vol = volumeMap.get(c.id) || 0;
        const volPrev = volumePrevMap.get(c.id) || 0;

        return {
          rank: index + 1,
          id: c.id,
          name: c.name,
          slug: c.slug || c.id, // Use slug if available, fallback to id for legacy collections
          image: c.image || '',
          floorPrice: formatPrice(c.floorPrice),
          floorPriceCurrency: 'ETH',
          volume24h: `${formatPrice(vol)} ETH`, // Keep field name for compatibility
          volumeChange24h: calculatePercentChange(vol, volPrev),
          sales24h: salesMap.get(c.id) || 0,
          owners: ownersMap.get(c.id) || 0,
          isVerified: c.isVerified,
        };
      })
      .sort((a, b) => {
        // Sort by volume (parse the number from string)
        const volA = parseFloat(a.volume24h.replace(' ETH', '')) || 0;
        const volB = parseFloat(b.volume24h.replace(' ETH', '')) || 0;
        return volB - volA;
      })
      .slice(0, 10)
      .map((c, index) => ({ ...c, rank: index + 1 })); // Re-assign ranks after sorting

    // Update cache
    collectionsCache.set(cacheKey, { data: topCollections, timestamp: Date.now() });

    return NextResponse.json({ success: true, collections: topCollections, timeframe: normalizedTimeframe });
  } catch (error) {
    console.error('Error fetching top collections:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch top collections' },
      { status: 500 }
    );
  }
}
