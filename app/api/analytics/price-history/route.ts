import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/analytics/price-history
 * Get price history for a collection or NFT
 * Query params:
 * - collectionId: Required - the collection to get price history for
 * - nftId: Optional - specific NFT within the collection
 * - period: '7d', '30d', '90d', 'all' (default: '30d')
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'api');
  if (rateLimitResult) return rateLimitResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get('collectionId');
    const nftId = searchParams.get('nftId');
    const period = searchParams.get('period') || '30d';

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'collectionId is required' },
        { status: 400 }
      );
    }

    // Verify collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
      select: {
        id: true,
        name: true,
        floorPrice: true,
        lastFloorPriceSync: true,
      },
    });

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build activity filter
    const activityWhere: any = {
      collectionId,
      createdAt: { gte: startDate },
      type: { in: ['listing_sold', 'auction_won', 'offer_accepted'] },
      amount: { not: null },
    };

    if (nftId) {
      activityWhere.nftId = nftId;
    }

    // Fetch sales activities
    const salesActivities = await prisma.activity.findMany({
      where: activityWhere,
      select: {
        id: true,
        amount: true,
        createdAt: true,
        type: true,
        nftId: true,
        nft: {
          select: {
            name: true,
            onChainTokenId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group sales by day for chart data
    const salesByDay: Record<
      string,
      {
        date: string;
        volume: number;
        sales: number;
        minPrice: number;
        maxPrice: number;
        avgPrice: number;
        prices: number[];
      }
    > = {};

    for (const activity of salesActivities) {
      const day = activity.createdAt.toISOString().split('T')[0];
      const price = activity.amount || 0;

      if (!salesByDay[day]) {
        salesByDay[day] = {
          date: day,
          volume: 0,
          sales: 0,
          minPrice: Infinity,
          maxPrice: -Infinity,
          avgPrice: 0,
          prices: [],
        };
      }

      salesByDay[day].volume += price;
      salesByDay[day].sales += 1;
      salesByDay[day].minPrice = Math.min(salesByDay[day].minPrice, price);
      salesByDay[day].maxPrice = Math.max(salesByDay[day].maxPrice, price);
      salesByDay[day].prices.push(price);
    }

    // Calculate averages and format
    const priceHistory = Object.values(salesByDay)
      .map((day) => ({
        date: day.date,
        volume: day.volume,
        sales: day.sales,
        minPrice: day.minPrice === Infinity ? null : day.minPrice,
        maxPrice: day.maxPrice === -Infinity ? null : day.maxPrice,
        avgPrice: day.prices.length > 0 ? day.prices.reduce((a, b) => a + b, 0) / day.prices.length : null,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate summary statistics
    const allPrices = salesActivities.map((a) => a.amount || 0).filter((p) => p > 0);
    const totalVolume = allPrices.reduce((a, b) => a + b, 0);
    const averagePrice = allPrices.length > 0 ? totalVolume / allPrices.length : null;
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : null;

    // Calculate price change
    let priceChange: number | null = null;
    let priceChangePercent: number | null = null;
    if (priceHistory.length >= 2) {
      const firstAvg = priceHistory[0].avgPrice;
      const lastAvg = priceHistory[priceHistory.length - 1].avgPrice;
      if (firstAvg && lastAvg && firstAvg > 0) {
        priceChange = lastAvg - firstAvg;
        priceChangePercent = ((lastAvg - firstAvg) / firstAvg) * 100;
      }
    }

    // Get recent sales for display
    const recentSales = salesActivities
      .slice(-10)
      .reverse()
      .map((a) => ({
        id: a.id,
        price: a.amount,
        date: a.createdAt,
        type: a.type,
        nft: a.nft
          ? {
              name: a.nft.name,
              tokenId: a.nft.onChainTokenId,
            }
          : null,
      }));

    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        currentFloorPrice: collection.floorPrice,
        lastUpdated: collection.lastFloorPriceSync,
      },
      period,
      summary: {
        totalSales: salesActivities.length,
        totalVolume,
        averagePrice,
        minPrice,
        maxPrice,
        priceChange,
        priceChangePercent,
      },
      priceHistory,
      recentSales,
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to fetch price history: ${errorMessage}` },
      { status: 500 }
    );
  }
}
