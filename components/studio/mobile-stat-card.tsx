'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MobileStatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  delay?: number;
}

export function MobileStatCard({ icon: Icon, value, label, trend, delay = 0 }: MobileStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 25 }}
      whileTap={{ scale: 0.98 }}
      className="relative group"
    >
      {/* Glassmorphic card with iOS styling */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
        {/* Icon container */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-[rgb(163,255,18)]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[rgb(163,255,18)]" />
          </div>

          {/* Trend indicator */}
          {trend && (
            <div className={`text-xs font-semibold ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>

        {/* Value */}
        <div className="text-2xl font-bold text-white mb-1">
          {value}
        </div>

        {/* Label */}
        <div className="text-sm text-white/60">
          {label}
        </div>
      </div>
    </motion.div>
  );
}
