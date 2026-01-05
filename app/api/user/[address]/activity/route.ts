import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ActivityType } from '@/lib/activity';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const rateLimitResult = await rateLimit(request, 'api');
  if (rateLimitResult) return rateLimitResult;

  const params = await context.params;
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // Activity type filter
    const days = parseInt(searchParams.get('days') || '90'); // last N days

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Normalize the address
    const normalizedAddress = address.toLowerCase();

    // Find user first
    const user = await prisma.user.findUnique({
      where: {
        walletAddress: normalizedAddress,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Build the where clause
    const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const where: {
      userId: string;
      type?: string;
      createdAt?: { gte: Date };
    } = {
      userId: user.id,
      createdAt: { gte: dateFilter },
    };

    if (type && type !== 'all') {
      where.type = type;
    }

    // Fetch activities with related data
    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          nft: {
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
                  image: true,
                },
              },
            },
          },
          collection: {
            select: {
              id: true,
              name: true,
              address: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    // Batch all aggregation queries with Promise.all to avoid sequential roundtrips
    const [statsRaw, volumeStats, uniqueCollections, lastActivity, availableTypes] = await Promise.all([
      // Get activity stats grouped by type
      prisma.activity.groupBy({
        by: ['type'],
        where: { userId: user.id },
        _count: true,
      }),
      // Calculate volume stats for sale activities
      prisma.activity.aggregate({
        where: {
          userId: user.id,
          type: { in: ['listing_sold', 'purchase'] },
        },
        _sum: { amount: true },
        _avg: { amount: true },
        _count: true,
      }),
      // Get unique collections count
      prisma.activity.groupBy({
        by: ['collectionId'],
        where: {
          userId: user.id,
          collectionId: { not: null },
        },
      }),
      // Get last activity timestamp
      prisma.activity.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      // Get available activity types for this user
      prisma.activity.groupBy({
        by: ['type'],
        where: { userId: user.id },
      }),
    ]);

    const stats = Object.fromEntries(
      statsRaw.map((s) => [s.type, s._count])
    ) as Record<ActivityType, number>;

    // Transform activities to match expected format
    const transformedActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      nft: activity.nft
        ? {
            id: activity.nft.id,
            name: activity.nft.name,
            image: activity.nft.image,
            tokenId: activity.nft.tokenId,
            collectionName: activity.nft.collection?.name || null,
            collectionSlug: activity.nft.collection?.address || null,
            contractAddress: activity.nft.collection?.address || null,
          }
        : null,
      collection: activity.collection
        ? {
            id: activity.collection.id,
            name: activity.collection.name,
            address: activity.collection.address,
            image: activity.collection.image,
          }
        : null,
      price: activity.amount,
      currency: activity.currency,
      txHash: activity.transactionHash,
      relatedUserId: activity.relatedUserId,
      relatedAddress: activity.relatedAddress,
      listingId: activity.listingId,
      tradeId: activity.tradeId,
      metadata: activity.metadata,
      timestamp: activity.createdAt,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        activity: transformedActivities,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        stats: {
          total,
          byType: stats,
          totalVolume: volumeStats._sum.amount || 0,
          totalSales: volumeStats._count || 0,
          averagePrice: volumeStats._avg.amount
            ? +volumeStats._avg.amount.toFixed(4)
            : 0,
          uniqueCollections: uniqueCollections.length,
          lastActivity: lastActivity?.createdAt || null,
        },
        filters: {
          availableTypes: availableTypes.map((t) => t.type),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}
