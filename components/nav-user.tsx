"use client"

import { useState, useRef, useEffect } from "react"
import {
  LogOut,
  User,
  Settings,
  Crown,
  Wallet,
  Copy,
  ExternalLink,
  ChevronRight,
  Activity,
  ArrowUpDown
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { CaretSortIcon } from "@radix-ui/react-icons"
import { ConnectButton } from "thirdweb/react"
import { sepolia } from "thirdweb/chains"
import { useAuth } from "@/contexts/auth-context"
import { client } from "@/lib/thirdweb"
import Link from "next/link"
import { useActiveAccount, useWalletBalance } from "thirdweb/react"
import { Badge } from "@/components/ui/badge"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user, isConnected, signOut } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const connectButtonRef = useRef<HTMLDivElement>(null)
  const account = useActiveAccount()
  
  // Get wallet balance
  const { data: balance, isLoading: balanceLoading } = useWalletBalance({
    client,
    chain: sepolia,
    address: account?.address,
  })

  // Handle copy address
  const copyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle manage wallet click
  const handleManageWallet = () => {
    // Close dropdown first
    setDropdownOpen(false)
    
    // Small delay to ensure dropdown is closed
    setTimeout(() => {
      // Find and click the hidden ConnectButton
      const button = connectButtonRef.current?.querySelector('button')
      if (button) {
        button.click()
      }
    }, 100)
  }

  if (!isConnected || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="px-2 py-1">
            <ConnectButton
              client={client}
              chain={sepolia}
              connectButton={{
                label: 'Connect Wallet',
                style: {
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  width: '100%',
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.2s ease',
                },
              }}
              connectModal={{
                size: 'wide',
                titleIcon: '',
                welcomeScreen: {
                  title: 'Connect to HypeX',
                  subtitle: 'Choose how you want to connect to the ultimate gaming NFT marketplace.',
                },
              }}
            />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const displayName = user.username || `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
  const formattedBalance = balance ? `${parseFloat(balance.displayValue).toFixed(4)} ${balance.symbol}` : '0.0000 ETH'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="w-full flex items-center gap-2 px-2 py-1 group hover:opacity-90 active:scale-[0.98] transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '600',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Avatar className="h-6 w-6 rounded-lg ring-1 ring-white/10">
                {user.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={displayName} />
                ) : (
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30">
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 text-left">
                <span className="truncate text-xs block">{displayName}</span>
              </div>
              <CaretSortIcon className="size-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[280px] rounded-xl border-white/10 bg-black/95 backdrop-blur-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* Wallet Header Section */}
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-xl ring-2 ring-white/10">
                    {user.profilePicture ? (
                      <AvatarImage src={user.profilePicture} alt={displayName} />
                    ) : (
                      <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{displayName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-500/10 text-green-400 border-green-500/30">
                        Sepolia
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet Address & Balance */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-muted-foreground font-mono">
                      {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-3 w-3 text-muted-foreground hover:text-white" />
                    </button>
                  </div>
                  {copied && (
                    <span className="text-[10px] text-green-400">Copied!</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <span className="text-sm font-semibold">{formattedBalance}</span>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-white/5" />

            {/* Quick Actions */}
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem 
                onClick={handleManageWallet}
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
              >
                <Wallet className="mr-2 h-4 w-4" />
                <span>Manage Wallet</span>
                <ChevronRight className="ml-auto h-3 w-3 opacity-50" />
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/activity" className="flex items-center cursor-pointer hover:bg-white/5 focus:bg-white/5">
                  <Activity className="mr-2 h-4 w-4" />
                  <span>Transaction History</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/bridge" className="flex items-center cursor-pointer hover:bg-white/5 focus:bg-white/5">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <span>Bridge Assets</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-white/5" />

            {/* Profile Actions */}
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user.walletAddress}`} className="flex items-center cursor-pointer hover:bg-white/5 focus:bg-white/5">
                  <User className="mr-2 h-4 w-4" />
                  <span>View Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer hover:bg-white/5 focus:bg-white/5">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-white/5" />

            {/* Creator Section */}
            <DropdownMenuGroup className="p-1">
              {user.creatorAppliedAt || user.isCreator ? (
                <DropdownMenuItem asChild>
                  <Link href="/studio" className="flex items-center cursor-pointer hover:bg-white/5 focus:bg-white/5">
                    <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                    <span>NFT Studio</span>
                    <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4" variant="secondary">
                      PRO
                    </Badge>
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href="/creator-onboarding" className="flex items-center cursor-pointer hover:bg-white/5 focus:bg-white/5">
                    <Crown className="mr-2 h-4 w-4" />
                    <span>Become a Creator</span>
                    <Badge className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border-0">
                      NEW
                    </Badge>
                  </Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-white/5" />

            {/* Sign Out */}
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem 
                onClick={signOut} 
                className="text-red-400 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden ConnectButton for wallet management */}
        <div ref={connectButtonRef} className="hidden">
          <ConnectButton
            client={client}
            chain={sepolia}
          />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}