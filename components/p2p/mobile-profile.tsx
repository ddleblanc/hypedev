'use client';

import { motion } from 'framer-motion';
import { User, TrendingUp, Award, DollarSign, History, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface MobileProfileProps {
  statsData?: {
    totalTrades: number;
    successRate: number;
    trustScore: number;
    totalVolume: string;
  };
  onViewHistory?: () => void;
  onSettings?: () => void;
  onDisconnect?: () => void;
}

export function MobileProfile({
  statsData = {
    totalTrades: 0,
    successRate: 0,
    trustScore: 0,
    totalVolume: '0',
  },
  onViewHistory,
  onSettings,
  onDisconnect,
}: MobileProfileProps) {
  const { user } = useAuth();

  return (
    <div className="relative z-10 min-h-screen px-4 pt-20 pb-32 bg-transparent">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30 flex items-center justify-center">
            <User className="w-5 h-5 text-[rgb(163,255,18)]" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Profile</h1>
        </div>
        <p className="text-white/50 text-base leading-relaxed">
          Your trading profile and statistics
        </p>
      </motion.div>

      {/* User Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6 p-6 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white text-2xl font-bold">
            {user?.username?.slice(0, 2).toUpperCase() || user?.walletAddress?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white text-lg font-semibold mb-1">
              {user?.username || 'Anonymous Trader'}
            </h2>
            <p className="text-white/40 text-sm font-mono truncate">
              {user?.walletAddress ? `${user.walletAddress.slice(0, 8)}...${user.walletAddress.slice(-6)}` : 'Not connected'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-6 grid grid-cols-2 gap-3"
      >
        <div className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-xs">Total Trades</span>
          </div>
          <span className="text-white text-2xl font-bold">{statsData.totalTrades}</span>
        </div>

        <div className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-[rgb(163,255,18)]" />
            <span className="text-white/60 text-xs">Success Rate</span>
          </div>
          <span className="text-[rgb(163,255,18)] text-2xl font-bold">{statsData.successRate}%</span>
        </div>

        <div className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-xs">Trust Score</span>
          </div>
          <span className="text-white text-2xl font-bold">{statsData.trustScore.toFixed(1)}</span>
        </div>

        <div className="p-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-white/60" />
            <span className="text-white/60 text-xs">Total Volume</span>
          </div>
          <span className="text-white text-lg font-bold">{statsData.totalVolume} ETH</span>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="space-y-3"
      >
        <h3 className="text-white/60 text-sm font-semibold mb-3 px-2">Quick Actions</h3>

        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-[rgb(163,255,18)]/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center group-hover:border-[rgb(163,255,18)]/30 transition-colors">
                <History className="w-5 h-5 text-white/70 group-hover:text-[rgb(163,255,18)] transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm">View Full History</p>
                <p className="text-white/40 text-xs">All trades and offers</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-[rgb(163,255,18)] transition-colors" />
          </button>
        )}

        {onSettings && (
          <button
            onClick={onSettings}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center transition-colors">
                <Settings className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm">Settings</p>
                <p className="text-white/40 text-xs">Preferences and notifications</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
          </button>
        )}

        {onDisconnect && (
          <button
            onClick={onDisconnect}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-black/40 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 group-hover:border-red-500/30 flex items-center justify-center transition-colors">
                <LogOut className="w-5 h-5 text-white/70 group-hover:text-red-500 transition-colors" />
              </div>
              <div className="text-left">
                <p className="text-white group-hover:text-red-500 font-semibold text-sm transition-colors">
                  Disconnect Wallet
                </p>
                <p className="text-white/40 text-xs">Sign out of your account</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-red-500 transition-colors" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
