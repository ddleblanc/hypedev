import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Check if an item is in a specific list or any list of a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const itemType = searchParams.get('itemType');
    const itemId = searchParams.get('itemId');
    const listId = searchParams.get('listId'); // Optional - check specific list

    if (!userId || !itemType || !itemId) {
      return NextResponse.json(
        { success: false, error: 'User ID, item type, and item ID are required' },
        { status: 400 }
      );
    }

    let whereClause: any = {
      list: { userId },
      itemType,
      itemId,
    };

    if (listId) {
      whereClause.listId = listId;
    }

    const items = await prisma.listItem.findMany({
      where: whereClause,
      include: {
        list: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Check specifically for watchlist
    const inWatchlist = items.some(item => item.list.type === 'watchlist');

    return NextResponse.json({
      success: true,
      inList: items.length > 0,
      inWatchlist,
      lists: items.map(item => ({
        listId: item.list.id,
        listName: item.list.name,
        listType: item.list.type,
      })),
    });
  } catch (error) {
    console.error('Check item error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}