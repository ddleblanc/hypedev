import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { rateLimitCheck } from '@/lib/rate-limit'

const applyCreatorSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
})

export async function POST(request: NextRequest) {
  // Rate limit: write operations (30 req/min)
  const rateCheck = await rateLimitCheck(request, "apiWrite")
  if (rateCheck.blocked) return rateCheck.response

  try {
    const body = await request.json()
    const { userId } = applyCreatorSchema.parse(body)

    const updatedUser = await auth.applyForCreator(userId)

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (error) {
    console.error('Apply for creator error:', error)
    
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