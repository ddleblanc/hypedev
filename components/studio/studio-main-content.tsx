"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StudioMainContentProps {
  children: React.ReactNode;
  currentView: string;
}

export function StudioMainContent({ children, currentView }: StudioMainContentProps) {
  return (
    <div className="relative h-full overflow-y-auto overflow-x-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            duration: 0.3, 
            ease: "easeInOut" 
          }}
          className="space-y-6 pb-8"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}