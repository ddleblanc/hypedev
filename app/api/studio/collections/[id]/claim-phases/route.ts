import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { claimPhases } = body;

    // Update collection with new claim phases
    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: {
        claimPhases: claimPhases, // Already stringified from frontend
      },
    });

    return NextResponse.json({
      success: true,
      collection: updatedCollection,
    });
  } catch (error) {
    console.error('Error updating claim phases:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update claim phases',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      select: {
        id: true,
        claimPhases: true,
        contractType: true,
        chainId: true,
        address: true,
      },
    });

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          error: 'Collection not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      collection: {
        ...collection,
        claimPhases: collection.claimPhases ? JSON.parse(collection.claimPhases) : [],
      },
    });
  } catch (error) {
    console.error('Error fetching claim phases:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch claim phases',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}