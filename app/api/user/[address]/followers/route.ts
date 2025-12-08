import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const params = await context.params;
  try {
    const { address } = params;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    // Find the user
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get followers (users who follow this user)
    const [followers, total] = await Promise.all([
      prisma.userFollow.findMany({
        where: { followingId: user.id },
        include: {
          follower: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              profilePicture: true,
              isCreator: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.userFollow.count({ where: { followingId: user.id } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      followers: followers.map((f) => ({
        ...f.follower,
        followedAt: f.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch followers' },
      { status: 500 }
    );
  }
}
