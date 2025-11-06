'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FairnessScoreBarProps {
  score: number; // 0-100
  userTotal: number;
  traderTotal: number;
}

export function FairnessScoreBar({ score, userTotal, traderTotal }: FairnessScoreBarProps) {
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 90) return { gradient: 'from-green-500 to-emerald-500', text: 'text-green-400', border: 'border-green-500/20' };
    if (score >= 75) return { gradient: 'from-green-400 to-yellow-400', text: 'text-yellow-400', border: 'border-yellow-500/20' };
    if (score >= 60) return { gradient: 'from-yellow-400 to-orange-400', text: 'text-orange-400', border: 'border-orange-500/20' };
    return { gradient: 'from-orange-500 to-red-500', text: 'text-red-400', border: 'border-red-500/20' };
  };

  const colors = getScoreColor();
  const difference = Math.abs(userTotal - traderTotal);
  const isBalanced = score >= 90;
  const userHigher = userTotal > traderTotal;

  return (
    <div className={`p-5 rounded-2xl bg-black/40 backdrop-blur-xl border ${colors.border}`}>
      {/* Score Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Deal Fairness</h3>
          {isBalanced ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Minus className="w-5 h-5 text-green-400" />
            </motion.div>
          ) : userHigher ? (
            <TrendingUp className="w-5 h-5 text-orange-400" />
          ) : (
            <TrendingDown className="w-5 h-5 text-orange-400" />
          )}
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
          className={`text-3xl font-bold ${colors.text}`}
        >
          {score}%
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-3 rounded-full bg-white/5 overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors.gradient} rounded-full`}
        />

        {/* Pulsing effect for unfair trades */}
        {score < 75 && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors.gradient} rounded-full`}
            style={{ width: `${score}%` }}
          />
        )}
      </div>

      {/* Value Breakdown */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center p-2 rounded-lg bg-green-500/10">
          <div className="text-white/60 mb-1">Your Value</div>
          <div className="font-mono font-semibold text-green-400">
            {userTotal.toFixed(3)} ETH
          </div>
        </div>

        <div className="text-center p-2 rounded-lg bg-white/5">
          <div className="text-white/60 mb-1">Difference</div>
          <div className={`font-mono font-semibold ${colors.text}`}>
            {difference.toFixed(3)} ETH
          </div>
        </div>

        <div className="text-center p-2 rounded-lg bg-purple-500/10">
          <div className="text-white/60 mb-1">Their Value</div>
          <div className="font-mono font-semibold text-purple-400">
            {traderTotal.toFixed(3)} ETH
          </div>
        </div>
      </div>

      {/* Status Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-center text-sm"
      >
        {score >= 95 ? (
          <span className="text-green-400 font-medium">✨ Perfectly balanced trade!</span>
        ) : score >= 85 ? (
          <span className="text-green-400">Great deal for both parties</span>
        ) : score >= 70 ? (
          <span className="text-yellow-400">Fair trade, slight imbalance</span>
        ) : score >= 50 ? (
          <span className="text-orange-400">Consider adjusting for fairness</span>
        ) : (
          <span className="text-red-400">Significantly unbalanced trade</span>
        )}
      </motion.div>
    </div>
  );
}
