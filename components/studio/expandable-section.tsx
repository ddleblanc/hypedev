'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface ExpandableSectionProps {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  isCompleted?: boolean;
  isRequired?: boolean;
  validationError?: string;
}

export function ExpandableSection({
  title,
  icon: Icon,
  subtitle,
  children,
  defaultExpanded = false,
  isCompleted = false,
  isRequired = false,
  validationError
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Section Header - iOS 56px touch target */}
      <motion.button
        whileTap={{ scale: 0.99 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full bg-white/5 backdrop-blur-lg border transition-all duration-300 ${
          isExpanded
            ? 'border-white/20 rounded-t-2xl'
            : 'border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20'
        } ${validationError ? 'border-red-500/50' : ''}`}
      >
        <div className="flex items-center gap-4 p-4 min-h-[56px]">
          {/* Icon */}
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isCompleted
                ? 'bg-green-500/20'
                : isExpanded
                  ? 'bg-[rgb(163,255,18)]/10'
                  : 'bg-white/5'
            }`}>
              <Icon className={`w-5 h-5 ${
                isCompleted
                  ? 'text-green-400'
                  : isExpanded
                    ? 'text-[rgb(163,255,18)]'
                    : 'text-white/60'
              }`} />
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">
                {title}
              </h3>
              {isRequired && !isCompleted && (
                <span className="text-xs text-red-400">*</span>
              )}
              {isCompleted && (
                <span className="text-xs text-green-400 font-medium">✓</span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-white/60 mt-0.5">
                {subtitle}
              </p>
            )}
            {validationError && (
              <p className="text-xs text-red-400 mt-1">
                {validationError}
              </p>
            )}
          </div>

          {/* Chevron indicator */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-white/60" />
          </motion.div>
        </div>
      </motion.button>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-white/5 backdrop-blur-lg border-x border-b border-white/20 rounded-b-2xl p-4">
              {/* iOS 16px spacing system */}
              <div className="space-y-4">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
