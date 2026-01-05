'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const widthClasses: Record<NonNullable<SlidePanelProps['width']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-2xl',
};

// =============================================================================
// Component
// =============================================================================

export function SlidePanel({
  isOpen,
  onClose,
  title,
  children,
  width = 'lg',
}: SlidePanelProps) {
  // Handle escape key to close panel
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Setup event listeners and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 bottom-0 z-50 w-full',
              widthClasses[width],
              'bg-studio-bg border-l border-studio-border',
              'flex flex-col overflow-hidden'
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'slide-panel-title' : undefined}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border flex-shrink-0">
                <h2
                  id="slide-panel-title"
                  className="text-lg font-semibold text-studio-text"
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-studio-surface transition-colors focus:outline-none focus:ring-2 focus:ring-studio-accent"
                  aria-label="Close panel"
                >
                  <X className="h-5 w-5 text-studio-text-muted" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
