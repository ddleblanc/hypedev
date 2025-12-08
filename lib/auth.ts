import { prisma } from '@/lib/prisma'

export interface UserWithSocials {
  id: string
  walletAddress: string
  email: string | null
  username: string | null
  profileCompleted: boolean
  profilePicture: string | null
  bannerImage: string | null
  bio: string | null
  isCreator: boolean
  creatorAppliedAt: Date | null
  creatorApprovedAt: Date | null
  createdAt: Date
  updatedAt: Date
  socials: {
    id: string
    platform: string
    url: string
  }[]
}

export interface FindOrCreateUserResult extends UserWithSocials {
  /** Whether the user was newly created (vs existing) */
  isNewUser: boolean
  /** Warning message if email couldn't be saved */
  emailWarning?: string
}

export class AuthService {
  static async findOrCreateUser(walletAddress: string, email?: string): Promise<FindOrCreateUserResult> {
    // Normalize wallet address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase()

    let isNewUser = false
    let emailWarning: string | undefined

    // First, try to find existing user
    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: { socials: true }
    })

    if (!user) {
      isNewUser = true
      // Use a transaction to create user and watchlist atomically
      try {
        user = await prisma.$transaction(async (tx) => {
          // Try to create the user
          const newUser = await tx.user.create({
            data: {
              walletAddress: normalizedAddress,
              email: email || null
            },
            include: { socials: true }
          })

          // Create default watchlist for the new user
          await tx.userList.create({
            data: {
              userId: newUser.id,
              name: 'Watchlist',
              type: 'watchlist',
              isPublic: false,
            }
          })

          return newUser
        })
      } catch (error: any) {
        // If we hit a unique constraint error, the user was created by another request
        // Fetch the user that was created
        if (error.code === 'P2002') {
          isNewUser = false // Actually not new, race condition
          user = await prisma.user.findUnique({
            where: { walletAddress: normalizedAddress },
            include: { socials: true }
          })

          if (!user) {
            throw new Error('Failed to create or find user')
          }
        } else {
          throw error
        }
      }
    }

    // Update email if provided and user doesn't have one
    if (email && !user.email) {
      try {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { email },
          include: { socials: true }
        })
      } catch (error: any) {
        // If email is already taken by another user, set warning instead of silently failing
        if (error.code === 'P2002') {
          emailWarning = 'Email address is already associated with another account'
        } else {
          throw error
        }
      }
    }

    return {
      ...user,
      isNewUser,
      emailWarning,
    }
  }

  static async getUserById(id: string): Promise<UserWithSocials | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: { socials: true }
    })
  }

  static async getUserByWallet(walletAddress: string): Promise<UserWithSocials | null> {
    // Normalize wallet address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase()
    
    return await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: { socials: true }
    })
  }

  static async getUserByUsername(username: string): Promise<UserWithSocials | null> {
    return await prisma.user.findUnique({
      where: { username },
      include: { socials: true }
    })
  }

  static async updateUserProfile(id: string, data: {
    username?: string
    profilePicture?: string
    bannerImage?: string
    bio?: string
    profileCompleted?: boolean
    socials?: Array<{ platform: string; url: string }>
  }): Promise<UserWithSocials> {
    const { socials, ...userData } = data

    // Update user data
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const user = await tx.user.update({
        where: { id },
        data: userData,
      })

      // Handle socials update if provided
      if (socials) {
        // Delete existing socials
        await tx.userSocial.deleteMany({
          where: { userId: id }
        })

        // Create new socials
        await tx.userSocial.createMany({
          data: socials.map(social => ({
            ...social,
            userId: id
          }))
        })
      }

      // Return updated user with socials
      return await tx.user.findUnique({
        where: { id },
        include: { socials: true }
      })
    })

    return updatedUser!
  }

  static async applyForCreator(userId: string): Promise<UserWithSocials> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        creatorAppliedAt: new Date(),
        // Note: isCreator stays false until admin approves
        // User can access Studio UI but cannot deploy contracts or mint
      },
      include: { socials: true }
    })
  }

  static async approveCreator(userId: string): Promise<UserWithSocials> {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        isCreator: true,
        creatorApprovedAt: new Date()
      },
      include: { socials: true }
    })
  }

  static async rejectCreator(userId: string, _rejectionReason?: string): Promise<UserWithSocials> {
    // Reset application status so they can reapply
    return await prisma.user.update({
      where: { id: userId },
      data: {
        creatorAppliedAt: null,
        isCreator: false,
        creatorApprovedAt: null
      },
      include: { socials: true }
    })
  }

  static async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (!existingUser) return true
    
    return excludeUserId ? existingUser.id === excludeUserId : false
  }

  static async isUserVerified(walletAddress: string): Promise<boolean> {
    const normalizedAddress = walletAddress.toLowerCase()
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress }
    })

    return user?.creatorApprovedAt !== null
  }

  static async canUserAccessStudio(walletAddress: string): Promise<boolean> {
    const normalizedAddress = walletAddress.toLowerCase()
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress }
    })

    // Users can access studio if they've applied (instant access) or are approved
    return user?.creatorAppliedAt !== null || user?.isCreator === true
  }

  /**
   * Check if user can perform contract operations (deploy collections, mint NFTs)
   * This requires admin approval (isCreator: true AND creatorApprovedAt set)
   */
  static async canUserDeployContracts(walletAddress: string): Promise<boolean> {
    const normalizedAddress = walletAddress.toLowerCase()
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress }
    })

    // Only admin-approved creators can deploy contracts and mint
    return user?.isCreator === true && user?.creatorApprovedAt !== null
  }

  /**
   * Check if user owns a specific collection (by being the creator)
   */
  static async doesUserOwnCollection(walletAddress: string, collectionId: string): Promise<boolean> {
    const normalizedAddress = walletAddress.toLowerCase()

    const collection = await prisma.collection.findUnique({
      where: { id: collectionId }
    })

    return collection?.creatorAddress === normalizedAddress
  }
}

export const auth = AuthService