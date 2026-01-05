import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeText } from '@/lib/sanitize';

const createListSchema = z.object({
  userId: z.string(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['watchlist', 'favorites', 'custom']).default('custom'),
  isPublic: z.boolean().default(false),
});

const getListsSchema = z.object({
  userId: z.string(),
  type: z.enum(['watchlist', 'favorites', 'custom', 'all']).optional(),
});

// GET - Fetch user's lists
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'api');
  if (rateLimitResult) return rateLimitResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'all';

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = { userId };
    if (type !== 'all') {
      whereClause.type = type;
    }

    const lists = await prisma.userList.findMany({
      where: whereClause,
      include: {
        items: {
          orderBy: { addedAt: 'desc' },
          take: 10, // Get latest 10 items per list
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      lists,
    });
  } catch (error) {
    console.error('Get lists error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new list
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'apiWrite');
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const validatedData = createListSchema.parse(body);

    // Sanitize user-provided text fields to prevent XSS
    const sanitizedData = {
      ...validatedData,
      name: sanitizeText(validatedData.name),
      description: validatedData.description ? sanitizeText(validatedData.description) : undefined,
    };

    // Check if watchlist already exists for this user
    if (validatedData.type === 'watchlist') {
      const existingWatchlist = await prisma.userList.findFirst({
        where: {
          userId: validatedData.userId,
          type: 'watchlist',
        },
      });

      if (existingWatchlist) {
        return NextResponse.json(
          { success: false, error: 'Watchlist already exists' },
          { status: 409 }
        );
      }
    }

    const list = await prisma.userList.create({
      data: sanitizedData,
      include: {
        items: true,
        _count: {
          select: { items: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      list,
    });
  } catch (error) {
    console.error('Create list error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a list
export async function DELETE(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'apiWrite');
  if (rateLimitResult) return rateLimitResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const listId = searchParams.get('listId');
    const userId = searchParams.get('userId');

    if (!listId || !userId) {
      return NextResponse.json(
        { success: false, error: 'List ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify the list belongs to the user
    const list = await prisma.userList.findFirst({
      where: {
        id: listId,
        userId,
      },
    });

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'List not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.userList.delete({
      where: { id: listId },
    });

    return NextResponse.json({
      success: true,
      message: 'List deleted successfully',
    });
  } catch (error) {
    console.error('Delete list error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}