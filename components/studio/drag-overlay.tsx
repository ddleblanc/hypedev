"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";

interface DragOverlayProps {
  dragActive: boolean;
}

export function DragOverlay({ dragActive }: DragOverlayProps) {
  return (
    <AnimatePresence>
      {dragActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[rgb(163,255,18)]/20 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="w-20 h-20 mx-auto bg-[rgb(163,255,18)] rounded-full flex items-center justify-center mb-4">
              <Upload className="w-10 h-10 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Drop files to upload</h3>
            <p className="text-white/60">Release to add NFTs to your collection</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
