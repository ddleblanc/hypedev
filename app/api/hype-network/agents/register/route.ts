import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthError } from "@/lib/thirdweb-auth";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const RegisterSchema = z.object({
  agentName: z.string().min(2).max(32).optional(),
  agentTag: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[A-Z0-9_]+$/, "Tag must be uppercase alphanumeric"),
});

export async function POST(request: NextRequest) {
  // Rate limit
  const rateLimitResult = await rateLimit(request, "api");
  if (rateLimitResult) return rateLimitResult;

  try {
    // Auth check
    const walletAddress = await requireAuth();

    // Get user
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found. Please create a profile first." },
        { status: 404 }
      );
    }

    // Parse body
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { agentName, agentTag } = parsed.data;

    // Check if already registered
    const existing = await prisma.hypeAgent.findUnique({
      where: { userId: user.id },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "You are already a Hype Agent" },
        { status: 409 }
      );
    }

    // Generate unique tag with discriminator
    let fullTag: string;
    let tagExists = true;
    let attempts = 0;

    do {
      const discriminator = Math.floor(1000 + Math.random() * 9000);
      fullTag = `${agentTag}#${discriminator}`;

      const existingTag = await prisma.hypeAgent.findUnique({
        where: { agentTag: fullTag },
      });

      tagExists = !!existingTag;
      attempts++;
    } while (tagExists && attempts < 10);

    if (tagExists) {
      return NextResponse.json(
        { success: false, error: "Unable to generate unique tag. Please try a different tag." },
        { status: 409 }
      );
    }

    // Create agent
    const agent = await prisma.hypeAgent.create({
      data: {
        userId: user.id,
        agentName,
        agentTag: fullTag,
      },
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        agentTag: agent.agentTag,
        agentName: agent.agentName,
        currentRank: agent.currentRank,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status }
      );
    }
    console.error("Error registering agent:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register as agent" },
      { status: 500 }
    );
  }
}
