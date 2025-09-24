import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const checkUsernameSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  excludeUserId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, excludeUserId } = checkUsernameSchema.parse(body)

    const isAvailable = await auth.isUsernameAvailable(username, excludeUserId)

    return NextResponse.json({
      success: true,
      available: isAvailable,
      username
    })
  } catch (error) {
    console.error('Check username error:', error)
    
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