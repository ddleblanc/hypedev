import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { collectionId, traits } = await request.json();

    if (!collectionId || !traits || !Array.isArray(traits)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Process each trait
    for (const trait of traits) {
      if (!trait.trait_type || !trait.value) continue;

      // Check if trait type exists for this collection
      let collectionTrait = await prisma.collectionTrait.findFirst({
        where: {
          collectionId,
          traitType: trait.trait_type
        }
      });

      // Create trait type if it doesn't exist
      if (!collectionTrait) {
        collectionTrait = await prisma.collectionTrait.create({
          data: {
            collectionId,
            traitType: trait.trait_type,
            totalValues: 0,
            totalNfts: 0
          }
        });
      }

      // Check if this value exists
      const existingValue = await prisma.collectionTraitValue.findFirst({
        where: {
          traitId: collectionTrait.id,
          value: trait.value
        }
      });

      if (!existingValue) {
        // Add new value
        await prisma.collectionTraitValue.create({
          data: {
            traitId: collectionTrait.id,
            value: trait.value,
            count: 1
          }
        });

        // Update trait stats
        await prisma.collectionTrait.update({
          where: { id: collectionTrait.id },
          data: {
            totalValues: { increment: 1 },
            totalNfts: { increment: 1 }
          }
        });
      } else {
        // Update existing value count
        await prisma.collectionTraitValue.update({
          where: { id: existingValue.id },
          data: {
            count: { increment: 1 }
          }
        });

        // Update trait stats
        await prisma.collectionTrait.update({
          where: { id: collectionTrait.id },
          data: {
            totalNfts: { increment: 1 }
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving traits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save traits' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'Collection ID required' },
        { status: 400 }
      );
    }

    const traits = await prisma.collectionTrait.findMany({
      where: { collectionId },
      include: {
        values: {
          orderBy: { count: 'desc' },
          take: 10 // Top 10 most used values
        }
      }
    });

    return NextResponse.json({
      success: true,
      traits: traits.map(t => ({
        trait_type: t.traitType,
        values: t.values.map(v => v.value)
      }))
    });
  } catch (error) {
    console.error('Error fetching traits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch traits' },
      { status: 500 }
    );
  }
}