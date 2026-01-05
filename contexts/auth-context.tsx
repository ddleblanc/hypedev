'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react'
import { useActiveAccount, useAutoConnect } from 'thirdweb/react'
import { useRouter } from 'next/navigation'
import { client } from '@/lib/thirdweb'
import { useTokenRefresh } from '@/hooks/use-token-refresh'

// ============================================================================
// Types
// ============================================================================

export interface AuthUser {
  id: string
  walletAddress: string
  email?: string
  username?: string
  profileCompleted: boolean
  profilePicture?: string
  bannerImage?: string
  bio?: string
  isCreator: boolean
  creatorAppliedAt?: Date
  creatorApprovedAt?: Date
  socials: Array<{
    id: string
    platform: string
    url: string
  }>
}

/**
 * Explicit auth states - no more boolean combinations
 */
export type AuthStatus =
  | 'initializing'           // Checking wallet and JWT
  | 'disconnected'           // No wallet connected
  | 'connected_no_jwt'       // Wallet connected, no JWT (needs SIWE)
  | 'connected_jwt_mismatch' // Wallet connected, JWT for different address
  | 'authenticated'          // Wallet connected, JWT valid and matches

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  walletAddress: string | null
  error: string | null
}

interface AuthContextType {
  // State
  status: AuthStatus
  user: AuthUser | null
  walletAddress: string | null

  // Computed (backwards compatible)
  isLoading: boolean          // status === 'initializing'
  isConnected: boolean        // wallet is connected (any status except disconnected/initializing)
  isAuthenticated: boolean    // status === 'authenticated'
  requiresOnboarding: boolean // authenticated but !profileCompleted
  isInitialized: boolean      // status !== 'initializing'

  // Actions
  refreshSession: () => Promise<void>
  refreshUser: () => Promise<void> // Alias for refreshSession (backwards compat)
  signOut: () => Promise<void>
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// State Machine Hook
// ============================================================================

// Custom event name for login completion
export const AUTH_LOGIN_EVENT = 'hpx:auth:login-complete'

function useAuthState() {
  const account = useActiveAccount()
  const { isLoading: isAutoConnecting } = useAutoConnect({
    client,
    timeout: 10000 // 10 seconds (increased from 3s for slow connections)
  })

  const [state, setState] = useState<AuthState>({
    status: 'initializing',
    user: null,
    walletAddress: null,
    error: null,
  })

  // Trigger to force re-verification after login
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Track previous wallet to detect changes
  const prevWalletRef = useRef<string | null>(null)
  // Track if we've done initial check
  const hasInitializedRef = useRef(false)

  // Listen for login completion events
  useEffect(() => {
    const handleLoginComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{ user?: AuthUser }>
      const userData = customEvent.detail?.user

      if (userData) {
        // Immediate state update with user data from login response
        const walletAddress = userData.walletAddress?.toLowerCase() ?? null
        prevWalletRef.current = walletAddress
        hasInitializedRef.current = true
        setState({
          status: 'authenticated',
          // Merge with defaults for optional fields not in login response
          user: { ...userData, socials: userData.socials ?? [] },
          walletAddress,
          error: null,
        })
      } else {
        // Fallback: increment trigger to force re-verification
        setRefreshTrigger(prev => prev + 1)
      }
    }

    window.addEventListener(AUTH_LOGIN_EVENT, handleLoginComplete)
    return () => {
      window.removeEventListener(AUTH_LOGIN_EVENT, handleLoginComplete)
    }
  }, [])

  // Memoized verify function
  const verifySession = useCallback(async (): Promise<{
    valid: boolean
    user: AuthUser | null
    jwtAddress: string | null
  }> => {
    try {
      const res = await fetch('/api/auth/verify')
      const data = await res.json()

      if (data.success && data.data?.loggedIn && data.data?.user) {
        return {
          valid: true,
          user: data.data.user as AuthUser,
          jwtAddress: data.data.user.walletAddress.toLowerCase(),
        }
      }

      return { valid: false, user: null, jwtAddress: null }
    } catch (error) {
      console.error('Session verification failed:', error)
      return { valid: false, user: null, jwtAddress: null }
    }
  }, [])

  // Single effect that handles all state transitions
  useEffect(() => {
    // Don't do anything while Thirdweb is still auto-connecting
    if (isAutoConnecting) {
      return
    }

    const updateAuthState = async () => {
      const walletAddress = account?.address?.toLowerCase() ?? null
      const prevWallet = prevWalletRef.current

      // Update ref for next comparison
      prevWalletRef.current = walletAddress

      // No wallet connected
      if (!walletAddress) {
        // Only verify session on initial load when no wallet
        if (!hasInitializedRef.current) {
          hasInitializedRef.current = true
          // Check if there's a valid JWT (page refresh scenario)
          const session = await verifySession()
          if (session.valid && session.user) {
            // JWT exists - update ref to match JWT wallet
            prevWalletRef.current = session.jwtAddress
            setState({
              status: 'authenticated',
              user: session.user,
              walletAddress: session.jwtAddress,
              error: null,
            })
            return
          }
        }

        setState({
          status: 'disconnected',
          user: null,
          walletAddress: null,
          error: null,
        })
        return
      }

      // Wallet connected - check JWT
      hasInitializedRef.current = true
      const session = await verifySession()

      if (!session.valid) {
        // No valid JWT - needs SIWE
        setState({
          status: 'connected_no_jwt',
          user: null,
          walletAddress,
          error: null,
        })
        return
      }

      // JWT exists - check if it matches connected wallet
      if (session.jwtAddress !== walletAddress) {
        // JWT for different wallet - log wallet switch
        if (prevWallet && prevWallet !== walletAddress) {
          console.log(`Wallet switched: ${prevWallet} → ${walletAddress}, clearing old session`)
        }

        // Clear the old JWT
        await fetch('/api/auth/logout', { method: 'POST' })

        setState({
          status: 'connected_jwt_mismatch',
          user: null,
          walletAddress,
          error: null,
        })
        return
      }

      // JWT valid and matches wallet
      setState({
        status: 'authenticated',
        user: session.user,
        walletAddress,
        error: null,
      })
    }

    updateAuthState()
  }, [account?.address, isAutoConnecting, verifySession, refreshTrigger])

  return { state, verifySession }
}

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const { state, verifySession } = useAuthState()
  const router = useRouter()
  const prevStatusRef = useRef<AuthStatus>('initializing')

  // Handle status transitions (e.g., redirect to onboarding)
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    const newStatus = state.status
    prevStatusRef.current = newStatus

    // User just authenticated - check if they need onboarding
    if (prevStatus !== 'authenticated' && newStatus === 'authenticated') {
      if (state.user && !state.user.profileCompleted) {
        router.push(`/signup?userId=${state.user.id}`)
      }
    }
  }, [state.status, state.user, router])

  const refreshSession = useCallback(async () => {
    // Re-verify session to get latest user data
    const session = await verifySession()
    // The state will be updated by the effect on next render
    // For immediate update, we could force a re-render, but
    // typically the effect handles this
  }, [verifySession])

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      // State will update via the effect when wallet disconnects
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [])

  const value: AuthContextType = useMemo(() => ({
    // State
    status: state.status,
    user: state.user,
    walletAddress: state.walletAddress,

    // Computed (backwards compatible)
    isLoading: state.status === 'initializing',
    isConnected: state.status !== 'disconnected' && state.status !== 'initializing',
    isAuthenticated: state.status === 'authenticated',
    requiresOnboarding: state.status === 'authenticated' && !!state.user && !state.user.profileCompleted,
    isInitialized: state.status !== 'initializing',

    // Actions
    refreshSession,
    refreshUser: refreshSession, // Backwards compatible alias
    signOut,
  }), [state, refreshSession, signOut])

  return (
    <AuthContext.Provider value={value}>
      <TokenRefreshManager />
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// Token Refresh Manager
// ============================================================================

/**
 * Internal component that manages automatic token refresh
 * Must be rendered inside AuthProvider to access auth context
 */
function TokenRefreshManager() {
  // The hook handles all refresh logic internally
  // It checks isAuthenticated from context and manages refresh lifecycle
  useTokenRefresh()
  return null
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
