'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Star,
  Crown,
  Gem,
  Zap,
  Target,
  Flame,
  Shield,
  Sword,
  Medal,
  Award,
  Gift,
  Gamepad2,
  TrendingUp,
  Users,
  Package,
  Lock,
  Check,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'trading' | 'gaming' | 'social' | 'collection' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  reward?: string;
}

interface LevelInfo {
  level: number;
  xp: number;
  xpToNextLevel: number;
  title: string;
  perks: string[];
}

const rarityColors = {
  common: { bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' },
  rare: { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
  epic: { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-400' },
  legendary: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
};

const categoryIcons = {
  trading: TrendingUp,
  gaming: Gamepad2,
  social: Users,
  collection: Package,
  special: Crown,
};

// Mock achievements data
const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'First Trade',
    description: 'Complete your first NFT trade',
    icon: TrendingUp,
    category: 'trading',
    rarity: 'common',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: '2024-01-15',
    reward: '50 XP',
  },
  {
    id: '2',
    name: 'Collector',
    description: 'Own 10 NFTs',
    icon: Package,
    category: 'collection',
    rarity: 'common',
    progress: 7,
    maxProgress: 10,
    unlocked: false,
  },
  {
    id: '3',
    name: 'High Roller',
    description: 'Trade over 10 ETH in volume',
    icon: Gem,
    category: 'trading',
    rarity: 'epic',
    progress: 5.2,
    maxProgress: 10,
    unlocked: false,
    reward: '500 XP + Badge',
  },
  {
    id: '4',
    name: 'Victory Streak',
    description: 'Win 5 games in a row',
    icon: Flame,
    category: 'gaming',
    rarity: 'rare',
    progress: 3,
    maxProgress: 5,
    unlocked: false,
    reward: '200 XP',
  },
  {
    id: '5',
    name: 'Social Butterfly',
    description: 'Get 100 followers',
    icon: Users,
    category: 'social',
    rarity: 'rare',
    progress: 45,
    maxProgress: 100,
    unlocked: false,
  },
  {
    id: '6',
    name: 'Lootbox Legend',
    description: 'Open 50 lootboxes',
    icon: Gift,
    category: 'special',
    rarity: 'legendary',
    progress: 12,
    maxProgress: 50,
    unlocked: false,
    reward: '1000 XP + Exclusive NFT',
  },
  {
    id: '7',
    name: 'Early Adopter',
    description: 'Join during launch period',
    icon: Star,
    category: 'special',
    rarity: 'legendary',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: '2024-01-01',
    reward: 'Exclusive Badge',
  },
  {
    id: '8',
    name: 'Master Trader',
    description: 'Complete 100 trades',
    icon: Crown,
    category: 'trading',
    rarity: 'epic',
    progress: 23,
    maxProgress: 100,
    unlocked: false,
  },
];

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = achievement.icon;
  const colors = rarityColors[achievement.rarity];
  const progressPercent = (achievement.progress / achievement.maxProgress) * 100;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all',
          achievement.unlocked
            ? `${colors.bg} ${colors.border} border-2`
            : 'bg-black/40 border-white/10'
        )}
      >
        {/* Locked overlay */}
        {!achievement.unlocked && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-white/30" />
          </div>
        )}

        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'p-3 rounded-lg',
                achievement.unlocked ? colors.bg : 'bg-white/10'
              )}
            >
              <Icon
                className={cn(
                  'h-6 w-6',
                  achievement.unlocked ? colors.text : 'text-white/40'
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={cn(
                    'font-bold',
                    achievement.unlocked ? 'text-white' : 'text-white/60'
                  )}
                >
                  {achievement.name}
                </h3>
                <Badge
                  className={cn(
                    'text-xs capitalize',
                    colors.bg,
                    colors.text,
                    colors.border
                  )}
                >
                  {achievement.rarity}
                </Badge>
              </div>

              <p className="text-sm text-white/60 mb-3">{achievement.description}</p>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Progress</span>
                  <span className={cn(achievement.unlocked ? colors.text : 'text-white/60')}>
                    {achievement.progress} / {achievement.maxProgress}
                  </span>
                </div>
                <Progress
                  value={progressPercent}
                  className={cn('h-2', achievement.unlocked && 'bg-white/20')}
                />
              </div>

              {/* Reward */}
              {achievement.reward && (
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <Gift className="h-3 w-3 text-yellow-400" />
                  <span className="text-yellow-400">{achievement.reward}</span>
                </div>
              )}

              {/* Unlocked date */}
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="mt-2 flex items-center gap-1 text-xs text-white/40">
                  <Check className="h-3 w-3 text-green-400" />
                  <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AchievementsPageContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    // Simulate loading achievements
    const timer = setTimeout(() => {
      setAchievements(mockAchievements);
      setLevelInfo({
        level: 23,
        xp: 7500,
        xpToNextLevel: 10000,
        title: 'Rising Star',
        perks: ['10% bonus XP', 'Custom profile badge', 'Early access to drops'],
      });
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[rgb(163,255,18)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black pt-20"
    >
      {/* Header */}
      <div className="px-4 md:px-8 pb-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="h-7 w-7 text-yellow-400" />
              Achievements
            </h1>
            <p className="text-white/60 mt-1">
              {unlockedCount} of {totalCount} unlocked
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-8">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 rounded-xl bg-white/5" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Level Card */}
            {levelInfo && (
              <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-500/20">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    {/* Level badge */}
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <span className="text-3xl font-bold text-black">
                          {levelInfo.level}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{levelInfo.title}</h2>
                        <p className="text-white/60">Level {levelInfo.level}</p>
                      </div>
                    </div>

                    {/* XP Progress */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-white/60">XP Progress</span>
                        <span className="text-white">
                          {levelInfo.xp.toLocaleString()} / {levelInfo.xpToNextLevel.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={(levelInfo.xp / levelInfo.xpToNextLevel) * 100}
                        className="h-3 bg-white/10"
                      />
                      <p className="text-xs text-white/40 mt-2">
                        {(levelInfo.xpToNextLevel - levelInfo.xp).toLocaleString()} XP to next level
                      </p>
                    </div>

                    {/* Perks */}
                    <div className="hidden lg:block">
                      <p className="text-xs text-white/40 mb-2">Level Perks</p>
                      <div className="space-y-1">
                        {levelInfo.perks.map((perk, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Zap className="h-3 w-3 text-yellow-400" />
                            <span className="text-white/80">{perk}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-[rgb(163,255,18)] text-black' : 'border-white/20 text-white'}
              >
                All
              </Button>
              {Object.entries(categoryIcons).map(([category, Icon]) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'capitalize',
                    selectedCategory === category
                      ? 'bg-[rgb(163,255,18)] text-black'
                      : 'border-white/20 text-white'
                  )}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {category}
                </Button>
              ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAchievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AchievementCard achievement={achievement} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AchievementsPage() {
  return (
    <ProtectedRoute requireOnboarding>
      <AchievementsPageContent />
    </ProtectedRoute>
  );
}
