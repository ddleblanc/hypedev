'use client';

import { motion } from 'framer-motion';
import { useP2PBackground } from '@/hooks/use-p2p-background';
import { ArrowRight, Package, Users, History, MessageCircle, Clock, TrendingUp } from 'lucide-react';

interface HubCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  backgroundImage: string;
}

interface MobileP2PHubProps {
  onNavigateToHistory?: () => void;
  onNavigateToTraders?: () => void;
  statsData?: {
    unreadMessages: number;
    activeOffers: number;
    pendingActions: number;
  };
}

export function MobileP2PHub({
  onNavigateToHistory,
  onNavigateToTraders,
  statsData = { unreadMessages: 0, activeOffers: 0, pendingActions: 0 }
}: MobileP2PHubProps) {
  const { navigateToCollections } = useP2PBackground();

  const cards: HubCard[] = [
    {
      id: 'trades',
      title: 'My Trades',
      description: 'Active offers and trade history',
      icon: <History className="w-6 h-6" />,
      action: onNavigateToHistory || (() => {}),
      backgroundImage: '/assets/img/mytrades.png',
    },
    {
      id: 'collections',
      title: 'Browse Collections',
      description: 'Explore NFTs by collection',
      icon: <Package className="w-6 h-6" />,
      action: navigateToCollections,
      backgroundImage: '/assets/img/browsebycollection.png',
    },
    {
      id: 'users',
      title: 'Browse Traders',
      description: 'Find collectors and their inventory',
      icon: <Users className="w-6 h-6" />,
      action: onNavigateToTraders || (() => {}),
      backgroundImage: '/assets/img/browsebytrader.png',
    },
  ];

  return (
    <div className="relative z-10 min-h-screen px-4 pt-20 pb-32 bg-transparent">
   

      {/* Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6 grid grid-cols-3 gap-3"
      >
        <div className="flex flex-col items-center justify-center py-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageCircle className="w-4 h-4 text-[rgb(163,255,18)]" />
            {statsData.unreadMessages > 0 && (
              <div className="w-5 h-5 rounded-full bg-[rgb(163,255,18)] flex items-center justify-center">
                <span className="text-black text-xs font-bold">
                  {statsData.unreadMessages > 9 ? '9+' : statsData.unreadMessages}
                </span>
              </div>
            )}
          </div>
          <span className="text-white text-lg font-bold">{statsData.unreadMessages}</span>
          <span className="text-white/40 text-xs">Messages</span>
        </div>

        <div className="flex flex-col items-center justify-center py-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
          <TrendingUp className="w-4 h-4 text-white/60 mb-1" />
          <span className="text-white text-lg font-bold">{statsData.activeOffers}</span>
          <span className="text-white/40 text-xs">Active</span>
        </div>

        <div className="flex flex-col items-center justify-center py-4 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10">
          <Clock className="w-4 h-4 text-white/60 mb-1" />
          <span className="text-white text-lg font-bold">{statsData.pendingActions}</span>
          <span className="text-white/40 text-xs">Pending</span>
        </div>
      </motion.div>

      {/* Hub Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 pb-8"
      >
        {cards.map((card, index) => (
          <HubCard key={card.id} card={card} index={index} />
        ))}
      </motion.div>
    </div>
  );
}

interface HubCardProps {
  card: HubCard;
  index: number;
}

function HubCard({ card }: HubCardProps) {
  return (
    <motion.button
      variants={cardVariants}
      whileTap={{ scale: 0.98 }}
      onClick={card.action}
      className="group relative w-full h-[240px] rounded-xl overflow-hidden border border-white/[0.08] hover:border-[rgb(163,255,18)]/30 shadow-xl shadow-black/60 transition-all duration-500 active:scale-98"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={card.backgroundImage}
          alt={card.title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Strong cinematic gradient for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black" />
      </div>

      {/* Content Overlay - Bottom section */}
      <div className="absolute inset-0 flex flex-col justify-end p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Title with icon */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-black/40 backdrop-blur-md border border-white/[0.1] flex items-center justify-center text-white group-hover:border-[rgb(163,255,18)]/40 transition-all duration-300">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[rgb(163,255,18)] transition-colors duration-300">
                {card.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-white/60 text-sm leading-relaxed pl-[52px] group-hover:text-white/80 transition-colors duration-300">
              {card.description}
            </p>
          </div>

          {/* Action Arrow */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-black/40 backdrop-blur-md border border-white/[0.1] flex items-center justify-center text-white/80 group-hover:bg-[rgb(163,255,18)]/20 group-hover:border-[rgb(163,255,18)]/60 group-hover:text-[rgb(163,255,18)] transition-all duration-300 group-hover:translate-x-1">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Framer Motion Variants (GPU-accelerated)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.23, 1, 0.32, 1] as [number, number, number, number], // Custom easing for smooth animation
    },
  },
};
