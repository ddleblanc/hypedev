import { NextResponse } from "next/server";
import { getAuthenticatedAddress } from "@/lib/thirdweb-auth";
import { auth } from "@/lib/auth";

/**
 * GET /api/auth/verify
 * Check if user is logged in and return their info
 */
export async function GET() {
  try {
    const address = await getAuthenticatedAddress();

    if (!address) {
      return NextResponse.json({
        success: true,
        loggedIn: false,
        user: null,
      });
    }

    // Get user from database
    const user = await auth.getUserByWallet(address);

    if (!user) {
      return NextResponse.json({
        success: true,
        loggedIn: false,
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      loggedIn: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        profileCompleted: user.profileCompleted,
        isCreator: user.isCreator,
        profilePicture: user.profilePicture,
        bannerImage: user.bannerImage,
        bio: user.bio,
        creatorAppliedAt: user.creatorAppliedAt,
        creatorApprovedAt: user.creatorApprovedAt,
        socials: user.socials,
      },
    });
  } catch (error) {
    console.error("Error verifying auth:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify authentication" },
      { status: 500 }
    );
  }
}
