import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAuthMatch, AuthError } from '@/lib/thirdweb-auth'

// Helper function to format ETH values for display
function formatEthValue(value: number): string | undefined {
  if (value === 0) return undefined // Don't display zero values
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K ETH`
  }
  if (value >= 1) {
    return `${value.toFixed(2)} ETH`
  }
  return `${value.toFixed(4)} ETH`
}

// Helper function to get default stats
function getDefaultStats(isCreator: boolean) {
  return {
    nftsOwned: 0,
    collectionsOwned: 0,
    volumeTraded: undefined,
    totalSales: 0,
    totalPurchases: 0,
    created: isCreator ? 0 : undefined,
    followers: 0,
    following: 0,
    avgSalePrice: 0,
    topSale: 0,
    salesCount: 0,
    purchasesCount: 0,
    joinedDays: 1,
  }
}

// Helper function to calculate user stats from database
async function calculateUserStats(walletAddress: string, isCreator: boolean) {
  const normalizedAddress = walletAddress.toLowerCase()

  try {
    // Get user record to get userId for Activity queries
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: {
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    })

    if (!user) {
      return getDefaultStats(isCreator)
    }

    // Run all queries in parallel for performance
    const [
      ownedNFTs,
      collectionsOwned,
      createdNFTs,
      salesData,
      purchasesData,
    ] = await Promise.all([
      // Count NFTs owned by this user
      prisma.nft.count({
        where: {
          ownerAddress: normalizedAddress,
          isMinted: true
        }
      }),

      // Count collections created by this user
      prisma.collection.count({
        where: { creatorAddress: normalizedAddress }
      }),

      // Count NFTs created (if creator)
      isCreator ? prisma.nft.count({
        where: {
          collection: {
            creatorAddress: normalizedAddress,
            isDeployed: true
          },
          isMinted: true
        }
      }) : Promise.resolve(0),

      // Get sales statistics from Activity table
      prisma.activity.aggregate({
        where: {
          userId: user.id,
          type: 'listing_sold',
          amount: { not: null }
        },
        _sum: { amount: true },
        _count: { id: true },
        _max: { amount: true }
      }),

      // Get purchases statistics from Activity table
      prisma.activity.aggregate({
        where: {
          userId: user.id,
          type: { in: ['purchase', 'auction_won'] },
          amount: { not: null }
        },
        _sum: { amount: true },
        _count: { id: true }
      }),
    ])

    // Calculate real volume stats
    const totalSales = salesData._sum.amount || 0
    const totalPurchases = purchasesData._sum.amount || 0
    const volumeTraded = totalSales + totalPurchases
    const salesCount = salesData._count.id
    const purchasesCount = purchasesData._count.id
    const avgSalePrice = salesCount > 0 ? totalSales / salesCount : 0
    const topSale = salesData._max.amount || 0

    // Calculate days since joined
    const joinedDays = user.createdAt
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      nftsOwned: ownedNFTs,
      collectionsOwned: collectionsOwned,
      volumeTraded: formatEthValue(volumeTraded),
      totalSales: +totalSales.toFixed(4),
      totalPurchases: +totalPurchases.toFixed(4),
      created: isCreator ? createdNFTs : undefined,
      followers: user._count?.followers || 0,
      following: user._count?.following || 0,
      avgSalePrice: +avgSalePrice.toFixed(4),
      topSale: +topSale.toFixed(4),
      salesCount,
      purchasesCount,
      joinedDays: Math.max(1, joinedDays),
    }
  } catch (error) {
    console.error('Error calculating user stats:', error)
    return getDefaultStats(isCreator)
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const params = await context.params;
  try {
    const { address } = params
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Use the auth service to get user by wallet address
    const user = await auth.getUserByWallet(address)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate real stats from database
    const stats = await calculateUserStats(user.walletAddress, user.isCreator)
    
    // Check verification status
    const verified = await auth.isUserVerified(user.walletAddress)

    // Return user data with enhanced profile information
    const userProfile = {
      ...user,
      stats,
      verified,
    }

    return NextResponse.json({
      success: true,
      user: userProfile
    })

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const params = await context.params;
  try {
    const { address } = params
    const body = await request.json()

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Verify that the authenticated user is the same as the address being updated
    try {
      await requireAuthMatch(address)
    } catch (authError) {
      if (authError instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: authError.status }
        )
      }
      throw authError
    }

    // Find existing user
    const existingUser = await auth.getUserByWallet(address)

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Check username availability if provided
    if (body.username && body.username !== existingUser.username) {
      const isAvailable = await auth.isUsernameAvailable(body.username, existingUser.id)
      if (!isAvailable) {
        return NextResponse.json(
          { success: false, error: 'Username is already taken' },
          { status: 409 }
        )
      }
    }

    // Update user profile using auth service
    const updatedUser = await auth.updateUserProfile(existingUser.id, {
      username: body.username,
      bio: body.bio,
      profilePicture: body.profilePicture,
      bannerImage: body.bannerImage,
      profileCompleted: body.profileCompleted,
      socials: body.socials
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user profile' },
      { status: 500 }
    )
  }
}

// Note: Follow/Unfollow functionality is implemented at /api/user/[address]/follow
// Use POST /api/user/[address]/follow with { followerAddress } to follow
// Use DELETE /api/user/[address]/follow with { followerAddress } to unfollow