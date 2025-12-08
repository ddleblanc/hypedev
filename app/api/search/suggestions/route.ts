import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch trending and popular search suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    // Fetch trending searches (marked as trending or high usage)
    const trendingSuggestions = await prisma.globalSuggestion.findMany({
      where: {
        category: 'search',
        OR: [
          { trending: true },
          { usage: { gte: 5 } }, // At least 5 uses
        ],
      },
      orderBy: [
        { trending: 'desc' },
        { usage: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        value: true,
        usage: true,
        trending: true,
      },
    });

    // Fetch popular collections for quick suggestions
    const popularCollections = await prisma.collection.findMany({
      where: { isDeployed: true },
      orderBy: [
        { floorPrice: 'desc' },
      ],
      take: 4,
      select: {
        id: true,
        name: true,
        image: true,
        isVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      trending: trendingSuggestions.map(s => ({
        id: s.id,
        query: s.value,
        isTrending: s.trending,
        searchCount: s.usage,
      })),
      popularCollections: popularCollections.map(c => ({
        id: c.id,
        name: c.name,
        image: c.image,
        isVerified: c.isVerified,
        type: 'collection' as const,
      })),
    });
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
