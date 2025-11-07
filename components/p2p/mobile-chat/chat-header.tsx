'use client';

import { ArrowLeft, MoreVertical, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatHeaderProps {
  traderName: string | null;
  traderAddress: string;
  tradeStatus: string | null;
  onBack: () => void;
  onViewTrade?: () => void;
}

export function ChatHeader({
  traderName,
  traderAddress,
  tradeStatus,
  onBack,
  onViewTrade,
}: ChatHeaderProps) {
  const getStatusInfo = (status: string | null) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending', color: 'text-yellow-500/70 bg-yellow-500/10 border-yellow-500/20' };
      case 'AGREED':
        return { label: 'Agreed', color: 'text-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)]/30' };
      case 'FINALIZED':
        return { label: 'Finalized', color: 'text-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10 border-[rgb(163,255,18)]/30' };
      case 'REJECTED':
        return { label: 'Rejected', color: 'text-red-500/70 bg-red-500/10 border-red-500/20' };
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'text-white/40 bg-black/40 border-white/10' };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo(tradeStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-[64px] left-0 right-0 z-40 bg-black/95 backdrop-blur-2xl border-b border-white/10"
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Back Button + Trader Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onBack}
              className="flex-shrink-0 w-9 h-9 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-base truncate">
                {traderName ||
                  `${traderAddress.slice(0, 6)}...${traderAddress.slice(-4)}`}
              </h2>
              {statusInfo && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-lg border ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: View Trade Button */}
          {onViewTrade && (
            <button
              onClick={onViewTrade}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 hover:border-[rgb(163,255,18)]/30 text-white/70 hover:text-[rgb(163,255,18)] text-sm font-medium flex items-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden xs:inline">View</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
