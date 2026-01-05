import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimitCheck } from "@/lib/rate-limit";
import { getAuthenticatedAddress } from "@/lib/thirdweb-auth";

// Admin wallets - should be in env vars in production
const ADMIN_WALLETS = (process.env.ADMIN_WALLET_ADDRESSES || "")
  .split(",")
  .map((addr) => addr.trim().toLowerCase())
  .filter(Boolean);

// Admin API key for server-to-server calls
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

/**
 * Check if the request is from an admin
 */
async function requireAdmin(request: NextRequest): Promise<{ error: string; status: number } | { address: string }> {
  // Check for API key (server-to-server)
  const apiKey = request.headers.get("x-admin-key");
  if (apiKey && ADMIN_API_KEY && apiKey === ADMIN_API_KEY) {
    return { address: "api-key-admin" };
  }

  // Check for wallet-based admin
  try {
    const address = await getAuthenticatedAddress();
    if (!address) {
      return { error: "Unauthorized", status: 401 };
    }

    const normalizedAddress = address.toLowerCase();
    if (!ADMIN_WALLETS.includes(normalizedAddress)) {
      return { error: "Forbidden - Admin access required", status: 403 };
    }

    return { address: normalizedAddress };
  } catch {
    return { error: "Unauthorized", status: 401 };
  }
}

// =============================================================================
// GET - List creator applications
// =============================================================================

const ListQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if ("error" in adminCheck) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  // Rate limit
  const rateLimit = await rateLimitCheck(request, "api");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = ListQuerySchema.parse({
      status: searchParams.get("status") || "pending",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
      search: searchParams.get("search") || undefined,
    });

    // Build where clause
    const where: Record<string, unknown> = {};
    if (query.status !== "all") {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search, mode: "insensitive" } },
        { bio: { contains: query.search, mode: "insensitive" } },
        { user: { walletAddress: { contains: query.search, mode: "insensitive" } } },
        { user: { username: { contains: query.search, mode: "insensitive" } } },
      ];
    }

    // Fetch applications with pagination
    const [applications, total] = await prisma.$transaction([
      prisma.creatorApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
              username: true,
              profilePicture: true,
              createdAt: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.creatorApplication.count({ where }),
    ]);

    // Get counts by status
    const [pendingCount, approvedCount, rejectedCount] = await prisma.$transaction([
      prisma.creatorApplication.count({ where: { status: "pending" } }),
      prisma.creatorApplication.count({ where: { status: "approved" } }),
      prisma.creatorApplication.count({ where: { status: "rejected" } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        applications,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
        counts: {
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: pendingCount + approvedCount + rejectedCount,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error listing applications:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Review (approve/reject) an application
// =============================================================================

const ReviewSchema = z.object({
  applicationId: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
  reviewNotes: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if ("error" in adminCheck) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  // Rate limit write operations
  const rateLimit = await rateLimitCheck(request, "apiWrite");
  if (rateLimit.blocked) return rateLimit.response;

  try {
    const body = await request.json();
    const { applicationId, action, reviewNotes } = ReviewSchema.parse(body);

    // Find the application
    const application = await prisma.creatorApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { success: false, error: `Application already ${application.status}` },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update application and user in transaction
    await prisma.$transaction(async (tx) => {
      // Update application status
      await tx.creatorApplication.update({
        where: { id: applicationId },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || null,
        },
      });

      // If approved, update user to be a creator
      if (action === "approve") {
        await tx.user.update({
          where: { id: application.userId },
          data: {
            isCreator: true,
            creatorApprovedAt: new Date(),
          },
        });
      }

      // Create notification for the user
      await tx.notification.create({
        data: {
          userId: application.userId,
          type: action === "approve" ? "creator_approved" : "creator_rejected",
          title:
            action === "approve"
              ? "Creator Application Approved!"
              : "Creator Application Update",
          message:
            action === "approve"
              ? "Congratulations! You are now a verified creator on HPX. You can now access the full Creator Studio."
              : reviewNotes
                ? `Your application was not approved. Feedback: ${reviewNotes}`
                : "Your application was not approved at this time. Please review the feedback and consider reapplying.",
          priority: "HIGH",
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
        status: newStatus,
        message: `Application ${newStatus} successfully`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error reviewing application:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET Single Application by ID
// =============================================================================

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdmin(request);
  if ("error" in adminCheck) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
  }

  try {
    const body = await request.json();
    const { applicationId } = z.object({ applicationId: z.string().uuid() }).parse(body);

    const application = await prisma.creatorApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            walletAddress: true,
            username: true,
            profilePicture: true,
            bannerImage: true,
            bio: true,
            createdAt: true,
            isCreator: true,
            creatorAppliedAt: true,
            creatorApprovedAt: true,
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { application },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
