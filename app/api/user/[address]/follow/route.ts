import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const params = await context.params;
  try {
    const { address } = params
    const { followerAddress } = await request.json()

    if (!address || !followerAddress) {
      return NextResponse.json(
        { success: false, error: 'Both user address and follower address are required' },
        { status: 400 }
      )
    }

    // Normalize addresses
    const normalizedAddress = address.toLowerCase()
    const normalizedFollowerAddress = followerAddress.toLowerCase()

    // Can't follow yourself
    if (normalizedAddress === normalizedFollowerAddress) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Find both users using auth service
    const [targetUser, followerUser] = await Promise.all([
      auth.getUserByWallet(normalizedAddress),
      auth.getUserByWallet(normalizedFollowerAddress)
    ])

    if (!targetUser || !followerUser) {
      return NextResponse.json(
        { success: false, error: 'One or both users not found' },
        { status: 404 }
      )
    }

    // Check if already following
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerUser.id,
          followingId: targetUser.id
        }
      }
    })

    if (existingFollow) {
      return NextResponse.json(
        { success: false, error: 'Already following this user' },
        { status: 409 }
      )
    }

    // Create follow relationship
    await prisma.userFollow.create({
      data: {
        followerId: followerUser.id,
        followingId: targetUser.id
      }
    })

    // Get updated counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.userFollow.count({
        where: { followingId: targetUser.id }
      }),
      prisma.userFollow.count({
        where: { followerId: followerUser.id }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Successfully followed user',
      data: {
        following: true,
        followersCount,
        followingCount: followingCount
      }
    })

  } catch (error) {
    console.error('Error following user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to follow user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const params = await context.params;
  try {
    const { address } = params
    const { followerAddress } = await request.json()

    if (!address || !followerAddress) {
      return NextResponse.json(
        { success: false, error: 'Both user address and follower address are required' },
        { status: 400 }
      )
    }

    // Normalize addresses
    const normalizedAddress = address.toLowerCase()
    const normalizedFollowerAddress = followerAddress.toLowerCase()

    // Find both users using auth service
    const [targetUser, followerUser] = await Promise.all([
      auth.getUserByWallet(normalizedAddress),
      auth.getUserByWallet(normalizedFollowerAddress)
    ])

    if (!targetUser || !followerUser) {
      return NextResponse.json(
        { success: false, error: 'One or both users not found' },
        { status: 404 }
      )
    }

    // Check if following exists
    const existingFollow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: followerUser.id,
          followingId: targetUser.id
        }
      }
    })

    if (!existingFollow) {
      return NextResponse.json(
        { success: false, error: 'Not following this user' },
        { status: 404 }
      )
    }

    // Delete follow relationship
    await prisma.userFollow.delete({
      where: {
        followerId_followingId: {
          followerId: followerUser.id,
          followingId: targetUser.id
        }
      }
    })

    // Get updated counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.userFollow.count({
        where: { followingId: targetUser.id }
      }),
      prisma.userFollow.count({
        where: { followerId: followerUser.id }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Successfully unfollowed user',
      data: {
        following: false,
        followersCount,
        followingCount
      }
    })

  } catch (error) {
    console.error('Error unfollowing user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unfollow user' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ address: string }> }
) {
  const params = await context.params;
  try {
    const { address } = params
    const { searchParams } = new URL(request.url)
    const checkFollower = searchParams.get('follower') // Check if this address is following the target

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'User address is required' },
        { status: 400 }
      )
    }

    const normalizedAddress = address.toLowerCase()

    // Find target user
    const targetUser = await auth.getUserByWallet(normalizedAddress)

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get followers and following counts
    const [followersCount, followingCount] = await Promise.all([
      prisma.userFollow.count({
        where: { followingId: targetUser.id }
      }),
      prisma.userFollow.count({
        where: { followerId: targetUser.id }
      })
    ])

    let isFollowing = false

    // Check if specific follower is following target user
    if (checkFollower) {
      const normalizedFollowerAddress = checkFollower.toLowerCase()
      const followerUser = await auth.getUserByWallet(normalizedFollowerAddress)

      if (followerUser) {
        const follow = await prisma.userFollow.findUnique({
          where: {
            followerId_followingId: {
              followerId: followerUser.id,
              followingId: targetUser.id
            }
          }
        })
        isFollowing = !!follow
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        followersCount,
        followingCount,
        isFollowing
      }
    })

  } catch (error) {
    console.error('Error getting follow status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get follow status' },
      { status: 500 }
    )
  }
}