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

export function useWalletAuthOptimized(): UseWalletAuthReturn {
  const account = useActiveAccount()
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(false) // Start with false for faster renders
  const [hasChecked, setHasChecked] = useState(false)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  // Check if we have cached user data from previous session
  const getCachedUser = useCallback(() => {
    if (typeof window === 'undefined') return null
    try {
      const cached = sessionStorage.getItem('wallet-auth-user')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }, [])

  const setCachedUser = useCallback((userData: AuthUser | null) => {
    if (typeof window === 'undefined') return
    try {
      if (userData) {
        sessionStorage.setItem('wallet-auth-user', JSON.stringify(userData))
      } else {
        sessionStorage.removeItem('wallet-auth-user')
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  const fetchOrCreateUser = useCallback(async (walletAddress: string) => {
    // Check cache first for faster loading
    const cachedUser = getCachedUser()
    if (cachedUser && cachedUser.walletAddress === walletAddress) {
      setUser(cachedUser)
      setIsLoading(false)
      // Still fetch in background to ensure data is fresh
      try {
        const response = await fetch('/api/auth/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress })
        })
        const data = await response.json()
        if (data.success) {
          setUser(data.user)
          setCachedUser(data.user)
        }
      } catch (error) {
        console.error('Background auth refresh error:', error)
      }
      return cachedUser
    }

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
        setCachedUser(data.user)
        
        // If user needs onboarding, redirect to signup
        if (data.requiresOnboarding) {
          router.push(`/signup?userId=${data.user.id}&walletAddress=${walletAddress}&profileCompleted=${data.user.profileCompleted}`)
        }
        
        return data.user
      } else {
        console.error('Failed to authenticate user:', data.error)
        setUser(null)
        setCachedUser(null)
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setUser(null)
      setCachedUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [router, getCachedUser, setCachedUser])

  const refreshUser = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/user/profile?userId=${user.id}`)
      const data = await response.json()
      
      if (data.success) {
        setUser(data.user)
        setCachedUser(data.user)
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }, [user?.id, setCachedUser])

  const signOut = useCallback(() => {
    setUser(null)
    setHasChecked(false)
    setCachedUser(null)
  }, [setCachedUser])

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
      setCachedUser(null)
    } else if (!account?.address && !hasChecked && !initialCheckDone) {
      // Check for cached user first
      const cachedUser = getCachedUser()
      if (cachedUser) {
        setUser(cachedUser)
        setIsLoading(false)
        setInitialCheckDone(true)
      } else {
        // Wait a bit on initial load to see if wallet will connect
        setIsLoading(true)
        const timeout = setTimeout(() => {
          setInitialCheckDone(true)
          setIsLoading(false)
        }, 1500) // Give wallet 1.5 seconds to auto-connect
        
        return () => clearTimeout(timeout)
      }
    }
  }, [account?.address, hasChecked, initialCheckDone, fetchOrCreateUser, getCachedUser, setCachedUser])

  return {
    user,
    isLoading,
    isConnected: !!account?.address,
    requiresOnboarding: !!user && !user.profileCompleted,
    refreshUser,
    signOut
  }
}