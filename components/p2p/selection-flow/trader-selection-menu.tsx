'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Users, X } from 'lucide-react';

interface TraderSelectionMenuProps {
  onChangeTrader: () => void;
  onCancel: () => void;
}

export function TraderSelectionMenu({
  onChangeTrader,
  onCancel,
}: TraderSelectionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (callback: () => void) => {
    setIsOpen(false);
    // Small delay to allow sheet to close before navigation
    setTimeout(callback, 200);
  };

  return (
    <>
      {/* Menu Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
        aria-label="More options"
      >
        <MoreVertical className="w-5 h-5 text-white" />
      </button>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 500) {
                  setIsOpen(false);
                }
              }}
              className="fixed bottom-0 left-0 right-0 z-[70] max-h-[70vh] rounded-t-3xl bg-black/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl overflow-hidden pb-safe-or-4"
            >
              {/* Drag Handle */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="px-5 pb-4 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Trade Options</h3>
                <p className="text-sm text-white/60 mt-1">
                  Change trader or cancel this trade
                </p>
              </div>

              {/* Menu Options */}
              <div className="px-5 py-4 space-y-2">
                {/* Change Trader */}
                <button
                  onClick={() => handleOptionClick(onChangeTrader)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all min-h-[56px]"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-semibold">Change Trader</div>
                    <div className="text-white/60 text-sm">Trade with someone else</div>
                  </div>
                </button>

                {/* Cancel Trade */}
                <button
                  onClick={() => handleOptionClick(onCancel)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all min-h-[56px]"
                >
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-red-400 font-semibold">Cancel Trade</div>
                    <div className="text-red-400/60 text-sm">Abandon this trade</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
