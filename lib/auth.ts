import { prisma } from '@/lib/prisma'

export interface UserWithSocials {
  id: string
  walletAddress: string
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

export class AuthService {
  static async findOrCreateUser(walletAddress: string): Promise<UserWithSocials> {
    // Normalize wallet address to lowercase for consistency
    const normalizedAddress = walletAddress.toLowerCase()
    
    let user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
      include: { socials: true }
    })

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress: normalizedAddress },
        include: { socials: true }
      })
    }

    return user
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
        isCreator: true // Grant instant access, but not approved yet
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
}

export const auth = AuthService