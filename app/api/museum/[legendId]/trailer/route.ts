import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paramsSchema = z.object({
  legendId: z.string().uuid(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ legendId: string }> }
) {
  const resolvedParams = await params;

  // Validate params
  const parsed = paramsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid legend ID format" },
      { status: 400 }
    );
  }

  const legend = await prisma.legend.findUnique({
    where: { id: parsed.data.legendId },
    select: {
      id: true,
      trailerVideoUrl: true,
      trailerDuration: true,
      status: true,
      name: true,
      bannerUrl: true,
    },
  });

  if (!legend) {
    return NextResponse.json(
      { error: "Legend not found" },
      { status: 404 }
    );
  }

  if (legend.status !== "ACTIVE" && legend.status !== "COMING_SOON") {
    return NextResponse.json(
      { error: "Legend not available" },
      { status: 403 }
    );
  }

  if (!legend.trailerVideoUrl) {
    return NextResponse.json(
      { error: "No trailer available for this legend" },
      { status: 404 }
    );
  }

  // In production, you would generate a signed URL here for CDN-hosted
  // or protected content. For now, we return the direct URL.
  //
  // For Thirdweb IPFS storage, URLs are already public.
  // For private CDN, you would:
  // 1. Generate a signed URL with expiration
  // 2. Include viewer analytics token
  // 3. Set up CORS properly
  const signedUrl = legend.trailerVideoUrl;

  return NextResponse.json({
    url: signedUrl,
    duration: legend.trailerDuration || 0,
    posterUrl: legend.bannerUrl,
    legendName: legend.name,
    // Expiry for signed URLs (1 hour from now)
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  });
}
