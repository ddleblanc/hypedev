"use client";

import React, { createContext, useContext, useMemo } from "react";
import { trpc } from "@/lib/trpc/client";

interface HypeAgent {
  id: string;
  agentTag: string;
  agentName: string | null;
  avatar: string | null;
  bio: string | null;
  totalXp: number;
  currentRank: string;
  rankProgress: number;
  totalReferrals: number;
  totalEarnings: string;
  totalCampaigns: number;
  totalChallengesWon: number;
  currentStreak: number;
  longestStreak: number;
  commissionMultiplier: number;
  isVerified: boolean;
  isBanned: boolean;
  lastReferralAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    username: string | null;
    profilePicture: string | null;
    walletAddress: string;
  };
  _count?: {
    links: number;
    commissions: number;
    achievements: number;
    challengeParticipations: number;
  };
}

interface AgentStats {
  totalXp: number;
  currentRank: string;
  rankProgress: number;
  totalReferrals: number;
  totalEarnings: string;
  totalCampaigns: number;
  totalChallengesWon: number;
  currentStreak: number;
  longestStreak: number;
  commissionMultiplier: number;
  isVerified: boolean;
  lastReferralAt: Date | null;
}

interface RegisterAgentInput {
  agentName?: string;
  agentTag: string;
}

interface UpdateAgentInput {
  agentName?: string;
  avatar?: string | null;
  bio?: string | null;
}

interface HypeNetworkContextValue {
  // Agent data
  agent: HypeAgent | null | undefined;
  stats: AgentStats | null | undefined;
  isLoading: boolean;
  isRegistered: boolean;

  // Actions
  registerAsAgent: (input: RegisterAgentInput) => Promise<unknown>;
  updateProfile: (input: UpdateAgentInput) => Promise<unknown>;
  refreshAgent: () => void;

  // Registration mutation state
  isRegistering: boolean;
  registerError: unknown;
}

const HypeNetworkContext = createContext<HypeNetworkContextValue | null>(null);

export function HypeNetworkProvider({ children }: { children: React.ReactNode }) {
  // Queries
  const {
    data: agent,
    isLoading: agentLoading,
    refetch: refetchAgent,
  } = trpc.hypeNetwork.agent.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
  });

  const { data: stats, isLoading: statsLoading } = trpc.hypeNetwork.agent.stats.useQuery(
    undefined,
    {
      enabled: !!agent,
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 60000, // 1 minute
    }
  );

  // Mutations
  const registerMutation = trpc.hypeNetwork.agent.register.useMutation({
    onSuccess: () => {
      refetchAgent();
    },
  });

  const updateMutation = trpc.hypeNetwork.agent.update.useMutation({
    onSuccess: () => {
      refetchAgent();
    },
  });

  // Actions
  const registerAsAgent = async (input: RegisterAgentInput) => {
    return registerMutation.mutateAsync(input);
  };

  const updateProfile = async (input: UpdateAgentInput) => {
    return updateMutation.mutateAsync(input);
  };

  const refreshAgent = () => {
    refetchAgent();
  };

  // Memoize context value
  const value = useMemo(
    () => ({
      agent: agent as HypeAgent | null | undefined,
      stats: stats as AgentStats | null | undefined,
      isLoading: agentLoading || statsLoading,
      isRegistered: !!agent,
      registerAsAgent,
      updateProfile,
      refreshAgent,
      isRegistering: registerMutation.isPending,
      registerError: registerMutation.error,
    }),
    [
      agent,
      stats,
      agentLoading,
      statsLoading,
      registerMutation.isPending,
      registerMutation.error,
    ]
  );

  return (
    <HypeNetworkContext.Provider value={value}>
      {children}
    </HypeNetworkContext.Provider>
  );
}

export function useHypeNetwork() {
  const context = useContext(HypeNetworkContext);
  if (!context) {
    throw new Error("useHypeNetwork must be used within HypeNetworkProvider");
  }
  return context;
}

// Helper hook for checking agent status without throwing
export function useIsHypeAgent() {
  const context = useContext(HypeNetworkContext);
  return {
    isAgent: !!context?.agent,
    isLoading: context?.isLoading ?? true,
  };
}

// Rank progression thresholds
export const RANK_THRESHOLDS = {
  ROOKIE: 0,
  PROMOTER: 500,
  INFLUENCER: 2000,
  AMBASSADOR: 5000,
  ELITE: 15000,
  LEGENDARY: 50000,
  MYTHIC: 150000,
} as const;

// Rank multipliers for commission calculation
export const RANK_MULTIPLIERS = {
  ROOKIE: 1.0,
  PROMOTER: 1.1,
  INFLUENCER: 1.25,
  AMBASSADOR: 1.5,
  ELITE: 1.75,
  LEGENDARY: 2.0,
  MYTHIC: 2.5,
} as const;

// Calculate progress to next rank
export function calculateRankProgress(currentXp: number, currentRank: string): number {
  const ranks = Object.keys(RANK_THRESHOLDS) as Array<keyof typeof RANK_THRESHOLDS>;
  const currentIndex = ranks.indexOf(currentRank as keyof typeof RANK_THRESHOLDS);

  if (currentIndex === ranks.length - 1) {
    return 100; // Already at max rank
  }

  const currentThreshold = RANK_THRESHOLDS[ranks[currentIndex]];
  const nextThreshold = RANK_THRESHOLDS[ranks[currentIndex + 1]];
  const xpInCurrentRank = currentXp - currentThreshold;
  const xpRequiredForNextRank = nextThreshold - currentThreshold;

  return Math.min(100, Math.round((xpInCurrentRank / xpRequiredForNextRank) * 100));
}

// Get next rank name
export function getNextRank(currentRank: string): string | null {
  const ranks = Object.keys(RANK_THRESHOLDS) as Array<keyof typeof RANK_THRESHOLDS>;
  const currentIndex = ranks.indexOf(currentRank as keyof typeof RANK_THRESHOLDS);

  if (currentIndex === -1 || currentIndex === ranks.length - 1) {
    return null;
  }

  return ranks[currentIndex + 1];
}

// Get XP required for next rank
export function getXpToNextRank(currentXp: number, currentRank: string): number {
  const nextRank = getNextRank(currentRank);
  if (!nextRank) return 0;

  return RANK_THRESHOLDS[nextRank as keyof typeof RANK_THRESHOLDS] - currentXp;
}
