'use client'

import { useState, useEffect } from 'react'
import { ProfileSetup } from '@/components/profile-setup'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConnectButton } from 'thirdweb/react'
import { client } from '@/lib/thirdweb'
import { Wallet, ArrowLeft, Crown, Sparkles, Shield, Users, Star, TrendingUp, Zap } from 'lucide-react'

interface User {
  id: string
  walletAddress: string
  username?: string
  profileCompleted: boolean
}

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [isConnecting] = useState(false)
  const [showCreatorSuccess, setShowCreatorSuccess] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(false)

  // Check if user data is passed via URL params (from wallet connection)
  useEffect(() => {
    const userId = searchParams.get('userId')
    const walletAddress = searchParams.get('walletAddress')
    const profileCompleted = searchParams.get('profileCompleted') === 'true'

    if (userId && walletAddress) {
      setUser({
        id: userId,
        walletAddress,
        profileCompleted
      })
    }
  }, [searchParams])

  const handleWalletConnect = () => {
    // This will be handled by the global wallet connection
    // The user should use the existing thirdweb connect button
    router.push('/')
  }

  const handleProfileComplete = (updatedUser: User) => {
    console.log('Profile completed, redirecting to home...')
    setUser(updatedUser)
    setProfileCompleted(true)
    
    // Use replace instead of push to avoid back button issues
    router.replace('/')
  }

  const handleApplyCreator = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/user/apply-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const data = await response.json()
      
      if (data.success) {
        setShowCreatorSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 3000)
      }
    } catch (error) {
      console.error('Creator application failed:', error)
    }
  }

  // Show creator application success
  if (showCreatorSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Premium background effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        
        <Card className="max-w-md w-full relative z-10 bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Crown className="w-10 h-10 text-primary animate-bounce" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl mb-3 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Creator Application Submitted!
            </CardTitle>
            <CardDescription className="mb-8 leading-relaxed text-muted-foreground">
              Your creator application has been submitted successfully. We&apos;ll review your application and get back to you soon.
            </CardDescription>
            
            {/* Success features */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <Shield className="w-4 h-4 text-green-500 mx-auto mb-1" />
                <div className="text-green-600 font-medium">Verified</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <div className="text-blue-600 font-medium">Priority Review</div>
              </div>
            </div>
            
            <Button 
              onClick={() => router.push('/')} 
              className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              Continue to Platform
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
            
            <p className="text-xs text-muted-foreground mt-4">
              Average review time: <span className="text-primary font-medium">24-48 hours</span>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading state if profile was just completed
  if (profileCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
        {/* Premium loading effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <Card className="p-8 text-center relative z-10 bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl max-w-md">
          <CardContent>
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-full mx-auto animate-pulse"></div>
            </div>
            <CardTitle className="text-lg bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Redirecting to your dashboard...
            </CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              Setting up your profile...
            </CardDescription>
            
            {/* Loading steps */}
            <div className="mt-6 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Creating profile</span>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Setting up preferences</span>
                <div className="w-2 h-2 bg-primary/50 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Finalizing setup</span>
                <div className="w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show profile setup if user exists but profile not completed
  if (user && !user.profileCompleted) {
    return (
      <div className="min-h-screen bg-background">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="fixed top-4 left-4 z-10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
        
        <ProfileSetup
          userId={user.id}
          walletAddress={user.walletAddress}
          onComplete={handleProfileComplete}
          onApplyCreator={handleApplyCreator}
        />
      </div>
    )
  }

  // Show premium wallet connection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      {/* Premium animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-secondary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJoc2woMjQwIDUuOSUgMTAlKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-6 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
              <Sparkles className="w-3 h-3 mr-1" />
              Welcome to the Future
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-6 leading-tight">
              HYPERCHAINX
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              The ultimate gaming NFT marketplace where legends are made and the future of digital ownership begins.
            </p>
          </div>

          {/* Main Card */}
          <Card className="max-w-lg mx-auto bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Wallet className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Connect Your Wallet
              </CardTitle>
              <CardDescription className="text-muted-foreground leading-relaxed">
                Connect your wallet to access premium collections, exclusive drops, and join the elite community.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Features */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <Shield className="w-4 h-4 text-primary mx-auto mb-1" />
                  <div className="text-muted-foreground">Secure</div>
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                  <div className="text-muted-foreground">Lightning Fast</div>
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                  <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <div className="text-muted-foreground">5M+ Users</div>
                </div>
              </div>
              
              {/* Connect Button */}
              <div className="space-y-4">
                <ConnectButton
                  client={client}
                  theme="dark"
                  connectButton={{
                    label: "Connect Wallet to Start",
                    className: "!w-full !bg-gradient-to-r !from-primary !to-primary/80 hover:!from-primary/90 hover:!to-primary !text-primary-foreground !border-0 !px-8 !py-4 !text-lg !font-semibold !rounded-lg !transition-all !duration-300 !shadow-lg hover:!shadow-xl hover:!scale-[1.02]"
                  }}
                  connectModal={{
                    size: 'wide',
                    title: 'Connect to HYPERCHAINX',
                    titleIcon: '',
                    welcomeScreen: {
                      title: 'Welcome to HYPERCHAINX',
                      subtitle: 'The ultimate gaming NFT marketplace. Choose how you want to connect.',
                    },
                  }}
                />
                
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="gap-2 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Explore First
                  </Button>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="text-center pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-3">Trusted by industry leaders</p>
                <div className="flex items-center justify-center space-x-6 opacity-60 text-xs font-medium">
                  <span>OpenSea</span>
                  <span>Coinbase</span>
                  <span>Binance</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom features */}
          <div className="grid md:grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto text-center">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
              <Star className="w-5 h-5 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">Premium Collections</h3>
              <p className="text-xs text-muted-foreground">Access exclusive NFTs from top creators</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">Smart Trading</h3>
              <p className="text-xs text-muted-foreground">AI-powered insights and analytics</p>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
              <Crown className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">VIP Access</h3>
              <p className="text-xs text-muted-foreground">Early access to drops and events</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}