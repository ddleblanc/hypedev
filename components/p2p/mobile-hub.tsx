'use client';

import { motion } from 'framer-motion';
import { useP2PBackground } from '@/hooks/use-p2p-background';
import { ArrowRight, Package, Users, History } from 'lucide-react';

interface HubCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  gradient: string;
}

export function MobileP2PHub() {
  const { navigateToCollections } = useP2PBackground();

  const cards: HubCard[] = [
    {
      id: 'collections',
      title: 'Browse by Collection',
      description: 'Explore NFTs organized by collection',
      icon: <Package className="w-8 h-8" />,
      action: navigateToCollections,
      gradient: 'from-purple-500/20 to-pink-500/20',
    },
    {
      id: 'users',
      title: 'Browse by User',
      description: 'Find traders and view their inventory',
      icon: <Users className="w-8 h-8" />,
      action: () => {}, // TODO: Implement user browsing
      gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      id: 'trades',
      title: 'My Trades',
      description: 'View active offers and trade history',
      icon: <History className="w-8 h-8" />,
      action: () => {}, // TODO: Implement trades view
      gradient: 'from-green-500/20 to-emerald-500/20',
    },
  ];

  return (
    <div className="relative z-10 min-h-screen px-4 pt-24 pb-safe-or-8 bg-transparent">
      {/* Title Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">
          P2P Trading
        </h1>
        <p className="text-white/60 text-lg">
          Trade NFTs directly with other collectors
        </p>
      </motion.div>

      {/* Hub Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-5"
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
      whileTap={{ scale: 0.95 }}
      onClick={card.action}
      className="group relative w-full min-h-[120px] p-5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/50 overflow-hidden transition-all duration-300 hover:border-white/20 active:scale-95"
    >
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}
      />

      {/* Content */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-start space-x-4">
          {/* Icon Container */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/90 group-hover:bg-white/20 transition-colors duration-300">
            {card.icon}
          </div>

          {/* Text Content */}
          <div className="flex-1 text-left">
            <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-white transition-colors">
              {card.title}
            </h3>
            <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/80 transition-colors">
              {card.description}
            </p>
          </div>
        </div>

        {/* Arrow Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 group-hover:bg-white/20 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
          <ArrowRight className="w-5 h-5" />
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
