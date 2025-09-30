import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET or CREATE default watchlist for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find or create the default watchlist
    let watchlist = await prisma.userList.findFirst({
      where: {
        userId,
        type: 'watchlist',
      },
      include: {
        items: {
          orderBy: { addedAt: 'desc' },
        },
        _count: {
          select: { items: true },
        },
      },
    });

    // If watchlist doesn't exist, create it
    if (!watchlist) {
      watchlist = await prisma.userList.create({
        data: {
          userId,
          name: 'Watchlist',
          type: 'watchlist',
          isPublic: false,
        },
        include: {
          items: {
            orderBy: { addedAt: 'desc' },
          },
          _count: {
            select: { items: true },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      watchlist,
    });
  } catch (error) {
    console.error('Get watchlist error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}