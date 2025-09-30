import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addItemSchema = z.object({
  listId: z.string(),
  itemType: z.enum(['collection', 'nft', 'launchpad', 'user', 'game']),
  itemId: z.string(),
  collectionId: z.string().optional(),
  metadata: z.any().optional(),
});

const removeItemSchema = z.object({
  listId: z.string(),
  itemType: z.string(),
  itemId: z.string(),
});

// POST - Add item to list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = addItemSchema.parse(body);

    // Check if item already exists in the list
    const existingItem = await prisma.listItem.findUnique({
      where: {
        listId_itemType_itemId: {
          listId: validatedData.listId,
          itemType: validatedData.itemType,
          itemId: validatedData.itemId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { success: false, error: 'Item already exists in this list' },
        { status: 409 }
      );
    }

    const item = await prisma.listItem.create({
      data: validatedData,
    });

    // Update the list's updatedAt timestamp
    await prisma.userList.update({
      where: { id: validatedData.listId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error('Add item error:', error);

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

// DELETE - Remove item from list
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listId = searchParams.get('listId');
    const itemType = searchParams.get('itemType');
    const itemId = searchParams.get('itemId');

    if (!listId || !itemType || !itemId) {
      return NextResponse.json(
        { success: false, error: 'List ID, item type, and item ID are required' },
        { status: 400 }
      );
    }

    const item = await prisma.listItem.findUnique({
      where: {
        listId_itemType_itemId: {
          listId,
          itemType,
          itemId,
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { success: false, error: 'Item not found in list' },
        { status: 404 }
      );
    }

    await prisma.listItem.delete({
      where: {
        listId_itemType_itemId: {
          listId,
          itemType,
          itemId,
        },
      },
    });

    // Update the list's updatedAt timestamp
    await prisma.userList.update({
      where: { id: listId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed successfully',
    });
  } catch (error) {
    console.error('Remove item error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get items in a list with optional filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const listId = searchParams.get('listId');
    const itemType = searchParams.get('itemType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!listId) {
      return NextResponse.json(
        { success: false, error: 'List ID is required' },
        { status: 400 }
      );
    }

    const whereClause: any = { listId };
    if (itemType) {
      whereClause.itemType = itemType;
    }

    const items = await prisma.listItem.findMany({
      where: whereClause,
      orderBy: { addedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.listItem.count({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      items,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get items error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}