"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

interface MuseumHeaderProps {
  show: boolean;
  currentItem?: { title: string; subtitle: string };
}

export function MuseumHeader({ show, currentItem }: MuseumHeaderProps) {
  const router = useRouter();

  return (
    <AnimatePresence>
      {show && (
        <motion.header
          className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#00ff88]/20"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.6, 0.05, 0.01, 0.9] }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-white hover:text-[#00ff88] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">Back to Home</span>
            </button>

            {currentItem && (
              <div className="text-center flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  {currentItem.title}
                </h1>
                <p className="text-sm text-[#00ff88]">{currentItem.subtitle}</p>
              </div>
            )}

            <div className="w-20" />
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
