'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Gamepad2, Image as ImageIcon, User } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: typeof TrendingUp;
}

interface MobileQuickActionsProps {
  onActionClick: (actionId: string) => void;
}

export function MobileQuickActions({ onActionClick }: MobileQuickActionsProps) {
  const actions: QuickAction[] = [
    { id: 'trade', label: 'Trade', icon: TrendingUp },
    { id: 'play', label: 'Play', icon: Gamepad2 },
    { id: 'museum', label: 'Museum', icon: ImageIcon },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 300, damping: 25 }}
      className="px-4"
    >
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onActionClick(action.id)}
              className="flex flex-col items-center gap-2 py-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.6 + (index * 0.1),
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-[rgb(163,255,18)]/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-[rgb(163,255,18)]" />
              </div>
              <span className="text-white text-xs font-medium">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
