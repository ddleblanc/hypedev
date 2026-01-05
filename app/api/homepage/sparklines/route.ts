import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

// Cache for sparkline data
const sparklinesCache: Map<string, { data: Record<string, SparklineData>; timestamp: number }> = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface SparklineData {
  collectionId: string;
  data: number[]; // Daily volume for each day
  trend: 'up' | 'down' | 'neutral';
  changePercent: number;
}

type Timeframe = '7d' | '30d';

function getTimeframeDays(timeframe: Timeframe): number {
  return timeframe === '7d' ? 7 : 30;
}

function calculateTrend(data: number[]): { trend: 'up' | 'down' | 'neutral'; changePercent: number } {
  if (data.length < 2) return { trend: 'neutral', changePercent: 0 };

  const first = data[0] || 0;
  const last = data[data.length - 1] || 0;

  if (first === 0 && last === 0) return { trend: 'neutral', changePercent: 0 };
  if (first === 0) return { trend: 'up', changePercent: 100 };

  const changePercent = ((last - first) / first) * 100;

  if (changePercent > 1) return { trend: 'up', changePercent };
  if (changePercent < -1) return { trend: 'down', changePercent };
  return { trend: 'neutral', changePercent };
}

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'api');
  if (rateLimitResult) return rateLimitResult;

  try {
    const { searchParams } = new URL(request.url);
    const collectionIdsParam = searchParams.get('collectionIds');
    const timeframe = (searchParams.get('timeframe') || '7d') as Timeframe;

    if (!collectionIdsParam) {
      return NextResponse.json({
        success: false,
        error: 'collectionIds parameter is required'
      }, { status: 400 });
    }

    const collectionIds = collectionIdsParam.split(',').slice(0, 20); // Limit to 20 collections
    const normalizedTimeframe = ['7d', '30d'].includes(timeframe) ? timeframe : '7d';

    // Check cache
    const cacheKey = `sparklines-${normalizedTimeframe}-${collectionIds.sort().join(',')}`;
    const cached = sparklinesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ success: true, sparklines: cached.data });
    }

    const days = getTimeframeDays(normalizedTimeframe);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Fetch daily activity aggregated by day for each collection
    const activities = await prisma.activity.findMany({
      where: {
        collectionId: { in: collectionIds },
        type: { in: ['purchase', 'listing_sold', 'auction_won', 'offer_accepted'] },
        amount: { not: null },
        createdAt: { gte: startDate },
      },
      select: {
        collectionId: true,
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group activities by collection and day
    const collectionDailyVolume: Record<string, Record<string, number>> = {};

    // Initialize all collections with empty day records
    for (const collectionId of collectionIds) {
      collectionDailyVolume[collectionId] = {};
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        collectionDailyVolume[collectionId][dateKey] = 0;
      }
    }

    // Sum up volumes by day
    for (const activity of activities) {
      if (!activity.collectionId || !activity.amount) continue;
      const dateKey = activity.createdAt.toISOString().split('T')[0];
      if (collectionDailyVolume[activity.collectionId]?.[dateKey] !== undefined) {
        collectionDailyVolume[activity.collectionId][dateKey] += activity.amount;
      }
    }

    // Transform to sparkline data
    const sparklines: Record<string, SparklineData> = {};

    for (const collectionId of collectionIds) {
      const dailyData = collectionDailyVolume[collectionId];
      const sortedDates = Object.keys(dailyData).sort();
      const data = sortedDates.map(date => dailyData[date]);
      const { trend, changePercent } = calculateTrend(data);

      sparklines[collectionId] = {
        collectionId,
        data,
        trend,
        changePercent,
      };
    }

    // Update cache
    sparklinesCache.set(cacheKey, { data: sparklines, timestamp: Date.now() });

    return NextResponse.json({ success: true, sparklines });
  } catch (error) {
    console.error('Error fetching sparklines:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sparkline data' },
      { status: 500 }
    );
  }
}
