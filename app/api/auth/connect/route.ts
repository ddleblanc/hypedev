import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const connectSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress } = connectSchema.parse(body)

    const user = await auth.findOrCreateUser(walletAddress)

    return NextResponse.json({
      success: true,
      user,
      requiresOnboarding: !user.profileCompleted
    })
  } catch (error) {
    console.error('Connect wallet error:', error)
    
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