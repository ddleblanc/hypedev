import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const upsertPreferenceSchema = z.object({
  userId: z.string(),
  category: z.string(),
  value: z.string().min(1),
});

// GET - Fetch user preferences
export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'api');
  if (rateLimitResult) return rateLimitResult;

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const category = searchParams.get('category');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const whereClause: { userId: string; category?: string } = { userId };
    if (category) {
      whereClause.category = category;
    }

    const preferences = await prisma.userPreference.findMany({
      where: whereClause,
      orderBy: { lastUsed: 'desc' },
    });

    // If category specified, return single preference or null
    if (category) {
      return NextResponse.json({
        success: true,
        preference: preferences[0] || null,
      });
    }

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Upsert user preference
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 'apiWrite');
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();
    const validatedData = upsertPreferenceSchema.parse(body);

    // Use a transaction to atomically delete existing preferences and create the new one
    // This prevents race conditions when rapidly changing preferences
    const preference = await prisma.$transaction(async (tx) => {
      // Delete any existing preferences for this user+category
      await tx.userPreference.deleteMany({
        where: {
          userId: validatedData.userId,
          category: validatedData.category,
        },
      });

      // Create the new preference
      return tx.userPreference.create({
        data: {
          userId: validatedData.userId,
          category: validatedData.category,
          value: validatedData.value,
          lastUsed: new Date(),
        },
      });
    });

    return NextResponse.json({
      success: true,
      preference,
    });
  } catch (error) {
    console.error('Upsert preference error:', error);

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
