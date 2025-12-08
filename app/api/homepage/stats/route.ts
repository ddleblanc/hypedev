import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { PlatformStats } from '@/types/homepage';

// Simple in-memory cache
let statsCache: { data: PlatformStats; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function formatVolume(volume: number): string {
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`;
  }
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K`;
  }
  return volume.toFixed(2);
}

function calculatePercentChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

export async function GET() {
  try {
    // Check cache
    if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ success: true, stats: statsCache.data });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Fetch all metrics in parallel
    const [
      // Total volume from all sales activities
      totalVolumeResult,
      // Collections count
      collectionsCount,
      // Users count
      usersCount,
      // Sales in last 24h
      sales24h,
      // Sales in previous 24h (for comparison)
      salesPrevious24h,
      // Volume in last 24h
      volume24h,
      // Volume in previous 24h
      volumePrevious24h,
    ] = await Promise.all([
      prisma.activity.aggregate({
        where: {
          type: { in: ['purchase', 'listing_sold', 'auction_won', 'offer_accepted'] },
          amount: { not: null },
        },
        _sum: { amount: true },
      }),
      prisma.collection.count({ where: { isDeployed: true } }),
      prisma.user.count(),
      prisma.activity.count({
        where: {
          type: { in: ['purchase', 'listing_sold', 'auction_won', 'offer_accepted'] },
          createdAt: { gte: oneDayAgo },
        },
      }),
      prisma.activity.count({
        where: {
          type: { in: ['purchase', 'listing_sold', 'auction_won', 'offer_accepted'] },
          createdAt: { gte: twoDaysAgo, lt: oneDayAgo },
        },
      }),
      prisma.activity.aggregate({
        where: {
          type: { in: ['purchase', 'listing_sold', 'auction_won', 'offer_accepted'] },
          amount: { not: null },
          createdAt: { gte: oneDayAgo },
        },
        _sum: { amount: true },
      }),
      prisma.activity.aggregate({
        where: {
          type: { in: ['purchase', 'listing_sold', 'auction_won', 'offer_accepted'] },
          amount: { not: null },
          createdAt: { gte: twoDaysAgo, lt: oneDayAgo },
        },
        _sum: { amount: true },
      }),
    ]);

    const totalVolume = totalVolumeResult._sum.amount || 0;
    const currentVolume24h = volume24h._sum.amount || 0;
    const prevVolume24h = volumePrevious24h._sum.amount || 0;

    const stats: PlatformStats = {
      totalVolume,
      totalVolumeFormatted: `${formatVolume(totalVolume)} ETH`,
      volumeChange24h: calculatePercentChange(currentVolume24h, prevVolume24h),
      collectionsCount,
      usersCount,
      sales24h,
      salesChange24h: calculatePercentChange(sales24h, salesPrevious24h),
    };

    // Update cache
    statsCache = { data: stats, timestamp: Date.now() };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching homepage stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platform statistics' },
      { status: 500 }
    );
  }
}
