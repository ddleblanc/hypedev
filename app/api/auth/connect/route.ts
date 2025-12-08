import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyJWT, getTokenFromHeader } from '@/lib/thirdweb-auth'
import { z } from 'zod'

const connectSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
  email: z.string().email().optional()
})

/**
 * POST /api/auth/connect
 *
 * Fetches or creates a user record. Requires JWT authentication.
 * The walletAddress in the body must match the authenticated wallet.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify JWT from cookie or Authorization header
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('tw_auth_token')?.value
    const token = getTokenFromHeader(authHeader) || cookieToken

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const authResult = await verifyJWT(token)
    if (!authResult.valid || !authResult.address) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { walletAddress, email } = connectSchema.parse(body)

    // Verify the requested wallet matches the authenticated wallet
    if (walletAddress.toLowerCase() !== authResult.address.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Wallet address mismatch' },
        { status: 403 }
      )
    }

    const user = await auth.findOrCreateUser(walletAddress, email)

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