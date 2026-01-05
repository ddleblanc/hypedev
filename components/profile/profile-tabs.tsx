'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, Palette, Heart, Activity, FileEdit, Package } from 'lucide-react';

export type ProfileTab = 'collected' | 'created' | 'drafts' | 'favorited' | 'activity' | 'lootboxes';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  showCreatedTab: boolean;
  showDraftsTab?: boolean;  // Only show on own profile for creators with drafts
  showLootboxesTab?: boolean;  // Show lootboxes tab when user has lootbox activity
  counts?: {
    collected?: number;
    created?: number;
    drafts?: number;
    favorited?: number;
    activity?: number;
    lootboxes?: number;
  };
}

interface TabConfig {
  id: ProfileTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showCondition?: boolean;
}

export function ProfileTabs({
  activeTab,
  onTabChange,
  showCreatedTab,
  showDraftsTab = false,
  showLootboxesTab = true,
  counts = {},
}: ProfileTabsProps) {
  const tabs: TabConfig[] = [
    {
      id: 'collected',
      label: 'Collected',
      icon: Sparkles,
    },
    {
      id: 'created',
      label: 'Created',
      icon: Palette,
      showCondition: showCreatedTab,
    },
    {
      id: 'drafts',
      label: 'Drafts',
      icon: FileEdit,
      showCondition: showDraftsTab,
    },
    {
      id: 'lootboxes',
      label: 'Lootboxes',
      icon: Package,
      showCondition: showLootboxesTab,
    },
    {
      id: 'favorited',
      label: 'Favorited',
      icon: Heart,
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: Activity,
    },
  ];

  const visibleTabs = tabs.filter(
    (tab) => tab.showCondition === undefined || tab.showCondition
  );

  return (
    <div className="border-b border-white/10">
      <div className="flex items-center gap-1 px-4 md:px-8 overflow-x-auto scrollbar-hide">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors whitespace-nowrap',
                isActive
                  ? 'text-[rgb(163,255,18)]'
                  : 'text-white/60 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-xs rounded-full',
                    isActive
                      ? 'bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)]'
                      : 'bg-white/10 text-white/60'
                  )}
                >
                  {count > 999 ? '999+' : count}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(163,255,18)]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
