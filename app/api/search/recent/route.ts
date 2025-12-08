import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's recent searches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId parameter is required'
      }, { status: 400 });
    }

    // Fetch recent searches with deduplication (get latest instance of each query)
    const recentSearches = await prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit * 2, // Get more to account for deduplication
      select: {
        id: true,
        query: true,
        category: true,
        resultId: true,
        resultType: true,
        createdAt: true,
      },
    });

    // Deduplicate by query (keep most recent)
    const seenQueries = new Set<string>();
    const dedupedSearches = recentSearches.filter(search => {
      const key = search.query.toLowerCase();
      if (seenQueries.has(key)) return false;
      seenQueries.add(key);
      return true;
    }).slice(0, limit);

    return NextResponse.json({
      success: true,
      searches: dedupedSearches
    });
  } catch (error) {
    console.error('Error fetching recent searches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recent searches' },
      { status: 500 }
    );
  }
}

// POST - Save a new search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, query, category = 'all', resultId, resultType } = body;

    if (!userId || !query) {
      return NextResponse.json({
        success: false,
        error: 'userId and query are required'
      }, { status: 400 });
    }

    // Validate query length
    if (query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 2 characters'
      }, { status: 400 });
    }

    // Create search history entry
    const searchEntry = await prisma.searchHistory.create({
      data: {
        userId,
        query: query.trim(),
        category,
        resultId,
        resultType,
      },
    });

    // Also update global suggestion for trending searches
    await prisma.globalSuggestion.upsert({
      where: {
        category_value: {
          category: 'search',
          value: query.trim().toLowerCase(),
        },
      },
      update: {
        usage: { increment: 1 },
        updatedAt: new Date(),
      },
      create: {
        category: 'search',
        value: query.trim().toLowerCase(),
        usage: 1,
        trending: false,
      },
    });

    return NextResponse.json({
      success: true,
      search: searchEntry
    });
  } catch (error) {
    console.error('Error saving search:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save search' },
      { status: 500 }
    );
  }
}

// DELETE - Clear user's search history
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const searchId = searchParams.get('searchId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId parameter is required'
      }, { status: 400 });
    }

    if (searchId) {
      // Delete specific search entry
      await prisma.searchHistory.deleteMany({
        where: {
          id: searchId,
          userId, // Ensure user can only delete their own searches
        },
      });
    } else {
      // Delete all searches for user
      await prisma.searchHistory.deleteMany({
        where: { userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting search history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete search history' },
      { status: 500 }
    );
  }
}
