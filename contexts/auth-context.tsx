'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useActiveAccount, useAutoConnect } from 'thirdweb/react'
import { useRouter } from 'next/navigation'
import { client } from '@/lib/thirdweb'

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

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isConnected: boolean
  requiresOnboarding: boolean
  refreshUser: () => Promise<void>
  signOut: () => void
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const account = useActiveAccount()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false)

  const fetchOrCreateUser = useCallback(async (walletAddress: string, email?: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, email })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)

        // If user needs onboarding, redirect to signup
        if (data.requiresOnboarding) {
          router.push(`/signup?userId=${data.user.id}&walletAddress=${walletAddress}&profileCompleted=${data.user.profileCompleted}`)
        }

        return data.user
      } else {
        console.error('Failed to authenticate user:', data.error)
        setUser(null)
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/user/profile?userId=${user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }, [user?.id])

  const signOut = useCallback(() => {
    setUser(null)
    setHasChecked(false)
    setIsInitialized(false)
    setAutoConnectAttempted(false)
  }, [])

  // Use auto-connect to listen for wallet connections
  const { data: autoConnected, isLoading: isAutoConnecting } = useAutoConnect({
    client,
    onConnect: (wallet) => {
      setAutoConnectAttempted(true)
      // The useEffect below will handle the actual user fetching
    },
    timeout: 3000, // 3 second timeout for auto-connect
  })

  // Monitor wallet connection changes
  useEffect(() => {
    if (account?.address && !hasChecked) {
      setHasChecked(true)

      // Try to extract email from in-app wallet account
      let email: string | undefined

      // Check if this is an in-app wallet with email
      // Thirdweb in-app wallets store the email in the account object
      if (account && 'details' in account) {
        const details = account.details as any
        if (details?.email) {
          email = details.email
        }
      }

      fetchOrCreateUser(account.address, email)
    } else if (!account?.address && hasChecked) {
      // Wallet disconnected
      setUser(null)
      setHasChecked(false)
      setIsLoading(false)
      setIsInitialized(true)
      setAutoConnectAttempted(false)
    } else if (!account?.address && !hasChecked && !isInitialized) {
      // Check if auto-connect is done trying
      if (!isAutoConnecting && autoConnectAttempted) {
        // Auto-connect finished (either succeeded or failed)
        setIsInitialized(true)
        setIsLoading(false)
      } else if (!isAutoConnecting && !autoConnectAttempted) {
        // Auto-connect hasn't started yet, give it a moment
        const timeout = setTimeout(() => {
          if (!autoConnectAttempted) {
            setAutoConnectAttempted(true)
            setIsInitialized(true)
            setIsLoading(false)
          }
        }, 100) // Very short timeout just to let auto-connect initialize

        return () => clearTimeout(timeout)
      }
    }
  }, [account?.address, hasChecked, isInitialized, isAutoConnecting, autoConnectAttempted, fetchOrCreateUser, account])

  const value: AuthContextType = {
    user,
    isLoading,
    isConnected: !!account?.address,
    requiresOnboarding: !!user && !user.profileCompleted,
    refreshUser,
    signOut,
    isInitialized
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}