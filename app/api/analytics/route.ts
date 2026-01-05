import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/analytics
 * Get platform-wide analytics or creator-specific analytics
 * Query params:
 * - creatorAddress: Filter to specific creator's analytics
 * - collectionId: Filter to specific collection
 * - period: '7d', '30d', '90d', 'all' (default: '30d')
 */
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'api');
  if (rateLimitResult) return rateLimitResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const creatorAddress = searchParams.get('creatorAddress');
    const collectionId = searchParams.get('collectionId');
    const period = searchParams.get('period') || '30d';

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
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Base filters
    const activityWhere: any = {
      createdAt: { gte: startDate },
    };

    const collectionWhere: any = {
      isDeployed: true,
    };

    // Apply creator filter
    if (creatorAddress) {
      const normalizedAddress = creatorAddress.toLowerCase();
      const user = await auth.getUserByWallet(normalizedAddress);
      if (user) {
        activityWhere.userId = user.id;
      }
      collectionWhere.creatorAddress = normalizedAddress;
    }

    // Apply collection filter
    if (collectionId) {
      activityWhere.collectionId = collectionId;
      collectionWhere.id = collectionId;
    }

    // Fetch all metrics in parallel
    const [
      // Sales metrics
      salesActivities,
      // Collection metrics
      collections,
      // NFT metrics
      nftStats,
      // User metrics (platform-wide only)
      userCount,
      creatorCount,
      // Recent activity
      recentActivity,
    ] = await Promise.all([
      // Sales activities (purchases, auction wins, offer accepts)
      prisma.activity.findMany({
        where: {
          ...activityWhere,
          type: { in: ['purchase', 'listing_sold', 'auction_won', 'offer_accepted'] },
        },
        select: {
          id: true,
          type: true,
          amount: true,
          createdAt: true,
          collectionId: true,
        },
      }),

      // Collections
      prisma.collection.findMany({
        where: collectionWhere,
        select: {
          id: true,
          name: true,
          floorPrice: true,
          _count: {
            select: { nfts: true },
          },
        },
      }),

      // NFT stats
      prisma.nft.aggregate({
        where: collectionId
          ? { collectionId }
          : creatorAddress
          ? { collection: { creatorAddress: creatorAddress.toLowerCase() } }
          : {},
        _count: { _all: true },
      }),

      // User count (platform-wide)
      !creatorAddress && !collectionId
        ? prisma.user.count()
        : Promise.resolve(null),

      // Creator count (platform-wide)
      !creatorAddress && !collectionId
        ? prisma.user.count({ where: { isCreator: true } })
        : Promise.resolve(null),

      // Recent activity
      prisma.activity.findMany({
        where: activityWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          amount: true,
          createdAt: true,
          user: {
            select: {
              username: true,
              walletAddress: true,
            },
          },
          nft: {
            select: {
              name: true,
              image: true,
            },
          },
          collection: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Calculate sales metrics
    const totalSales = salesActivities.filter((a) => a.type === 'listing_sold' || a.type === 'auction_won' || a.type === 'offer_accepted').length;
    const totalVolume = salesActivities
      .filter((a) => a.type === 'listing_sold' || a.type === 'auction_won' || a.type === 'offer_accepted')
      .reduce((sum, a) => sum + (a.amount || 0), 0);
    const totalPurchases = salesActivities.filter((a) => a.type === 'purchase').length;

    // Calculate unique holders
    const uniqueHolders = await prisma.nft.groupBy({
      by: ['ownerAddress'],
      where: collectionId
        ? { collectionId }
        : creatorAddress
        ? { collection: { creatorAddress: creatorAddress.toLowerCase() } }
        : {},
    });

    // Group sales by day for chart data
    const salesByDay: Record<string, { sales: number; volume: number }> = {};
    for (const activity of salesActivities.filter(
      (a) => a.type === 'listing_sold' || a.type === 'auction_won' || a.type === 'offer_accepted'
    )) {
      const day = activity.createdAt.toISOString().split('T')[0];
      if (!salesByDay[day]) {
        salesByDay[day] = { sales: 0, volume: 0 };
      }
      salesByDay[day].sales += 1;
      salesByDay[day].volume += activity.amount || 0;
    }

    // Convert to sorted array
    const salesChart = Object.entries(salesByDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Collection leaderboard
    const collectionVolumes: Record<string, number> = {};
    for (const activity of salesActivities) {
      if (activity.collectionId) {
        collectionVolumes[activity.collectionId] = (collectionVolumes[activity.collectionId] || 0) + (activity.amount || 0);
      }
    }

    const topCollections = collections
      .map((c) => ({
        id: c.id,
        name: c.name,
        floorPrice: c.floorPrice,
        nftCount: c._count.nfts,
        volume: collectionVolumes[c.id] || 0,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      period,
      metrics: {
        totalSales,
        totalVolume,
        totalPurchases,
        averageSalePrice: totalSales > 0 ? totalVolume / totalSales : 0,
        totalNfts: nftStats._count._all,
        uniqueHolders: uniqueHolders.length,
        totalCollections: collections.length,
        ...(userCount !== null && { totalUsers: userCount }),
        ...(creatorCount !== null && { totalCreators: creatorCount }),
      },
      charts: {
        salesOverTime: salesChart,
      },
      topCollections,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: a.type,
        amount: a.amount,
        createdAt: a.createdAt,
        user: a.user
          ? {
              name: a.user.username || `${a.user.walletAddress.slice(0, 6)}...${a.user.walletAddress.slice(-4)}`,
            }
          : null,
        nft: a.nft
          ? {
              name: a.nft.name,
              image: a.nft.image,
            }
          : null,
        collection: a.collection?.name,
      })),
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to fetch analytics: ${errorMessage}` },
      { status: 500 }
    );
  }
}
