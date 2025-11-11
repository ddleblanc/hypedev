'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

interface Mission {
  title: string;
  progress: number;
  reward: string;
  status: 'active' | 'completed';
}

interface MobileMissionsCardProps {
  missions: Mission[];
}

export function MobileMissionsCard({ missions }: MobileMissionsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeMissions = missions.filter(m => m.status === 'active');
  const displayedMissions = isExpanded ? activeMissions : activeMissions.slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 25 }}
      className="px-4"
    >
      <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[rgb(163,255,18)]" />
            <h3 className="text-white font-bold text-sm">Active Missions</h3>
          </div>
          <span className="text-white/60 text-xs">
            {activeMissions.length} Active
          </span>
        </div>

        {/* Missions List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {displayedMissions.map((mission, index) => (
              <motion.div
                key={mission.title}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white text-xs font-medium truncate flex-1">
                    {mission.title}
                  </span>
                  <span className="text-[rgb(163,255,18)] text-xs font-bold ml-2">
                    {mission.reward}
                  </span>
                </div>
                <Progress
                  value={mission.progress}
                  className="h-1.5 bg-white/10"
                />
                <div className="text-white/40 text-[10px]">
                  {mission.progress}% complete
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Expand/Collapse Button */}
        {activeMissions.length > 2 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-white/60 text-xs font-medium">
              {isExpanded ? 'Show Less' : `View All (${activeMissions.length})`}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 text-white/60" />
            ) : (
              <ChevronDown className="w-3 h-3 text-white/60" />
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
