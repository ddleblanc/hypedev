"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnimatedFooterProps {
  show: boolean;
}

export function AnimatedFooter({ show }: AnimatedFooterProps) {
  const stats = [
    { label: '24h Volume', value: '$12.4M', icon: DollarSign, change: '+32%' },
    { label: 'Active Users', value: '45.2K', icon: Users, change: '+18%' },
    { label: 'Collections', value: '892', icon: TrendingUp, change: '+5%' }
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.footer
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 30,
            duration: 0.4
          }}
          className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-white/10"
          style={{ backgroundColor: 'rgb(3, 3, 3)' }}
        >
          {/* Stats Bar Only */}
          <div style={{ backgroundColor: 'rgba(3, 3, 3, 0.3)' }}>
            <div className="container mx-auto px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-[rgb(163,255,18)]" />
                          <span className="text-xs text-white/60">{stat.label}:</span>
                        </div>
                        <span className="text-sm font-bold text-white">{stat.value}</span>
                        <Badge className="text-[10px] bg-[rgb(163,255,18)]/10 text-[rgb(163,255,18)] border-[rgb(163,255,18)]/30">
                          {stat.change}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-[rgb(163,255,18)] rounded-full animate-pulse" />
                  <span className="text-xs text-[rgb(163,255,18)] font-medium">Network Active</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
}