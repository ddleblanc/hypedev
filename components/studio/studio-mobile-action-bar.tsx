'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

interface StudioMobileActionBarProps {
  show?: boolean;
  showBack?: boolean;
  backLabel?: string;
  primaryLabel: string;
  primaryAction: () => void;
  secondaryAction?: () => void;
  isPrimaryDisabled?: boolean;
  isPrimaryLoading?: boolean;
  variant?: 'primary' | 'success' | 'destructive';
  className?: string;
}

export function StudioMobileActionBar({
  show = true,
  showBack = false,
  backLabel = 'Back',
  primaryLabel,
  primaryAction,
  secondaryAction,
  isPrimaryDisabled = false,
  isPrimaryLoading = false,
  variant = 'primary',
  className = ''
}: StudioMobileActionBarProps) {
  const variantStyles = {
    primary: 'bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90',
    success: 'bg-green-500 text-white hover:bg-green-600',
    destructive: 'bg-red-500/90 text-white hover:bg-red-600'
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`md:hidden fixed bottom-0 left-0 right-0 z-30 ${className}`}
        >
          {/* Glassmorphic background with safe area */}
          <div className="bg-black/95 backdrop-blur-xl border-t border-white/10">
            <div className="px-4 pt-3 pb-8">
              {/* iOS safe area: 32px total (24px content + 8px bottom) */}
              <div className="flex gap-3">
                {/* Back Button - iOS 44pt touch target */}
                {showBack && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    onClick={secondaryAction}
                    className="flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-xl border border-white/30 text-white hover:bg-white/10 transition-colors active:bg-white/20"
                    style={{ minWidth: '88px' }} // iOS minimum button width
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-medium">{backLabel}</span>
                  </motion.button>
                )}

                {/* Primary Action Button - Flexible width */}
                <motion.button
                  whileTap={{ scale: isPrimaryDisabled || isPrimaryLoading ? 1 : 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={primaryAction}
                  disabled={isPrimaryDisabled || isPrimaryLoading}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 min-h-[48px] rounded-xl font-bold transition-all ${
                    isPrimaryDisabled || isPrimaryLoading
                      ? 'bg-white/10 text-white/40 cursor-not-allowed'
                      : variantStyles[variant]
                  }`}
                >
                  {isPrimaryLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>{primaryLabel}</span>
                      {variant === 'success' && <Check className="w-5 h-5" />}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
