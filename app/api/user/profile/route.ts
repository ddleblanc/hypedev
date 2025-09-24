import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const updateProfileSchema = z.object({
  userId: z.string(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  profilePicture: z.string().optional().or(z.literal('')), // Allow IPFS URIs
  bannerImage: z.string().optional().or(z.literal('')), // Allow IPFS URIs  
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  profileCompleted: z.boolean().optional(),
  socials: z.array(z.object({
    platform: z.enum(['twitter', 'instagram', 'discord', 'telegram', 'website', 'youtube']),
    url: z.string().url()
  })).optional()
})


export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('PUT /api/user/profile - Received body:', body)
    
    const validatedData = updateProfileSchema.parse(body)
    console.log('PUT /api/user/profile - Validated data:', validatedData)
    
    const { userId, username, ...updateData } = validatedData

    // Check if username is available if provided
    if (username) {
      const isAvailable = await auth.isUsernameAvailable(username, userId)
      if (!isAvailable) {
        console.log('PUT /api/user/profile - Username not available:', username)
        return NextResponse.json(
          { success: false, error: 'Username is already taken' },
          { status: 409 }
        )
      }
    }

    console.log('PUT /api/user/profile - Updating user with data:', { userId, username, ...updateData })
    const updatedUser = await auth.updateUserProfile(userId, {
      username,
      ...updateData
    })

    console.log('PUT /api/user/profile - Update successful, user:', updatedUser)
    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Update profile error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await auth.getUserById(userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Get profile error:', error)
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}