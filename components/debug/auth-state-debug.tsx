'use client'

import { useAuth } from '@/contexts/auth-context'

/**
 * Debug component to visualize auth state during development
 * Only renders in development environment
 */
export function AuthStateDebug() {
  const auth = useAuth()

  if (process.env.NODE_ENV !== 'development') return null

  const statusColors: Record<string, string> = {
    initializing: 'text-yellow-400',
    disconnected: 'text-gray-400',
    connected_no_jwt: 'text-orange-400',
    connected_jwt_mismatch: 'text-red-400',
    authenticated: 'text-green-400',
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-4 rounded-lg font-mono z-50 max-w-xs">
      <div className="font-bold mb-2 text-blue-400">Auth Debug</div>
      <div className="space-y-1">
        <div>
          Status:{' '}
          <span className={statusColors[auth.status] || 'text-white'}>
            {auth.status}
          </span>
        </div>
        <div>
          Wallet:{' '}
          <span className="text-gray-300">
            {auth.walletAddress ? `${auth.walletAddress.slice(0, 6)}...${auth.walletAddress.slice(-4)}` : 'null'}
          </span>
        </div>
        <div>
          User:{' '}
          <span className="text-gray-300">
            {auth.user?.username || (auth.user?.id ? `${auth.user.id.slice(0, 8)}...` : 'null')}
          </span>
        </div>
        <div className="pt-1 border-t border-gray-700 mt-1">
          <span className={auth.isLoading ? 'text-yellow-400' : 'text-gray-500'}>
            {auth.isLoading ? 'Loading...' : 'Ready'}
          </span>
        </div>
      </div>
    </div>
  )
}
