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
            duration: 0.35, 
            ease: "easeInOut" 
          }}
          className="pb-8"
        >
          {/* Page container with minimal padding */}
          <section className="p-4">
            <div className="space-y-6">
              {children}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}