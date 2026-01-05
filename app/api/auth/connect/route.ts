import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { verifyJWT, getTokenFromHeader } from '@/lib/thirdweb-auth'
import { z } from 'zod'
import { rateLimitCheck } from '@/lib/rate-limit'
import { AUTH_COOKIE_NAME } from '@/lib/constants/auth'

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
  // Rate limit authentication operations
  const rateLimit = await rateLimitCheck(request, 'auth')
  if (rateLimit.blocked) return rateLimit.response

  try {
    // Verify JWT from cookie or Authorization header
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const token = getTokenFromHeader(authHeader) || cookieToken

    if (!token) {
      return rateLimit.applyHeaders(NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ))
    }

    const authResult = await verifyJWT(token)
    if (!authResult.valid || !authResult.address) {
      return rateLimit.applyHeaders(NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      ))
    }

    const body = await request.json()
    const { walletAddress, email } = connectSchema.parse(body)

    // Verify the requested wallet matches the authenticated wallet
    if (walletAddress.toLowerCase() !== authResult.address.toLowerCase()) {
      return rateLimit.applyHeaders(NextResponse.json(
        { success: false, error: 'Wallet address mismatch' },
        { status: 403 }
      ))
    }

    const user = await auth.findOrCreateUser(walletAddress, email)

    return rateLimit.applyHeaders(NextResponse.json({
      success: true,
      user,
      requiresOnboarding: !user.profileCompleted
    }))
  } catch (error) {
    console.error('Connect wallet error:', error)

    if (error instanceof z.ZodError) {
      return rateLimit.applyHeaders(NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      ))
    }

    return rateLimit.applyHeaders(NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    ))
  }
}