"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize2, Info } from "lucide-react";

interface MuseumFooterProps {
  show: boolean;
  onClose?: () => void;
}

export function MuseumFooter({ show, onClose }: MuseumFooterProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.footer
          className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-t border-[#00ff88]/20"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.6, 0.05, 0.01, 0.9] }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button className="p-2 text-white hover:text-[#00ff88] transition-colors">
                <Info className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-[#00ff88] text-black font-semibold rounded-lg hover:bg-[#00ff88]/90 transition-colors"
                >
                  Back to Museum
                </button>
              )}
            </div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
}
