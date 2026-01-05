"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMuseum } from "@/contexts/museum-context";

export function TheaterExitButton() {
  const { isTheaterMode, exitTheaterMode, theaterPhase } = useMuseum();

  const showButton = isTheaterMode && theaterPhase === 'immersive';

  return (
    <AnimatePresence>
      {showButton && (
        <motion.div
          className="fixed top-6 left-6 z-[110]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Button
            variant="ghost"
            size="lg"
            onClick={exitTheaterMode}
            className="group bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-full transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-light tracking-wide">Exit Hall</span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
