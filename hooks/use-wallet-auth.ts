'use client'

import { useState, useEffect, useCallback } from 'react'
import { useActiveAccount } from 'thirdweb/react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  id: string
  walletAddress: string
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

interface UseWalletAuthReturn {
  user: AuthUser | null
  isLoading: boolean
  isConnected: boolean
  requiresOnboarding: boolean
  refreshUser: () => Promise<void>
  signOut: () => void
}

export function useWalletAuth(): UseWalletAuthReturn {
  const account = useActiveAccount()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChecked, setHasChecked] = useState(false)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  const fetchOrCreateUser = useCallback(async (walletAddress: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
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
    // Note: You may also want to disconnect the thirdweb wallet here
    // depending on your app's logout behavior
  }, [])

  // Monitor wallet connection changes
  useEffect(() => {
    if (account?.address && !hasChecked) {
      setHasChecked(true)
      setInitialCheckDone(true)
      fetchOrCreateUser(account.address)
    } else if (!account?.address && hasChecked) {
      // Wallet disconnected
      setUser(null)
      setHasChecked(false)
      setIsLoading(false)
    } else if (!account?.address && !hasChecked && !initialCheckDone) {
      // Wait a bit on initial load to see if wallet will connect
      const timeout = setTimeout(() => {
        setInitialCheckDone(true)
        setIsLoading(false)
      }, 1500) // Give wallet 1.5 seconds to auto-connect
      
      return () => clearTimeout(timeout)
    }
  }, [account?.address, hasChecked, initialCheckDone, fetchOrCreateUser])

  return {
    user,
    isLoading,
    isConnected: !!account?.address,
    requiresOnboarding: !!user && !user.profileCompleted,
    refreshUser,
    signOut
  }
}