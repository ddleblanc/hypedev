import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ActivityItem } from '@/types/homepage';
import { rateLimit } from '@/lib/rate-limit';

// Simple in-memory cache
let activityCache: { data: ActivityItem[]; timestamp: number } | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds - fresher data for activity feed

function mapActivityType(type: string): ActivityItem['type'] {
  switch (type) {
    case 'purchase':
    case 'listing_sold':
    case 'auction_won':
    case 'offer_accepted':
      return 'sale';
    case 'listing_created':
      return 'listing';
    case 'bid_placed':
      return 'bid';
    case 'nft_minted':
      return 'mint';
    default:
      return 'transfer';
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function truncateAddress(address: string): string {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'api');
  if (rateLimitResult) return rateLimitResult;

  try {
    // Check cache
    if (activityCache && Date.now() - activityCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ success: true, activities: activityCache.data });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Fetch recent activities with related data
    const activities = await prisma.activity.findMany({
      where: {
        type: {
          in: [
            'purchase',
            'listing_sold',
            'auction_won',
            'offer_accepted',
            'listing_created',
            'bid_placed',
            'nft_minted',
          ],
        },
        createdAt: { gte: oneHourAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        createdAt: true,
        relatedAddress: true,
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
            tokenId: true,
          },
        },
        collection: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    // Transform to ActivityItem format
    const activityItems: ActivityItem[] = activities
      .filter(a => a.nft && a.collection) // Only include activities with NFT and collection data
      .map(a => ({
        id: a.id,
        type: mapActivityType(a.type),
        nft: {
          name: a.nft!.name,
          image: a.nft!.image,
          tokenId: a.nft!.tokenId,
        },
        collection: {
          name: a.collection!.name,
          slug: a.collection!.slug || a.collection!.id,
        },
        price: a.amount ? a.amount.toFixed(4).replace(/\.?0+$/, '') : undefined,
        priceCurrency: a.currency || 'ETH',
        from: a.user?.walletAddress || 'Unknown',
        fromUsername: a.user?.username || undefined,
        to: a.relatedAddress || undefined,
        timestamp: formatTimeAgo(a.createdAt),
      }));

    // Update cache
    activityCache = { data: activityItems, timestamp: Date.now() };

    return NextResponse.json({ success: true, activities: activityItems });
  } catch (error) {
    console.error('Error fetching homepage activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}
