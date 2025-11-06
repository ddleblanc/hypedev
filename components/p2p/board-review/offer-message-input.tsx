'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface OfferMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function OfferMessageInput({
  value,
  onChange,
  placeholder = 'Add a message to your offer (optional)',
}: OfferMessageInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const characterLimit = 500;
  const charactersRemaining = characterLimit - value.length;

  return (
    <div className="rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 overflow-hidden">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-white/60" />
          <span className="text-white font-medium">
            {value ? 'Message Added' : 'Add Message (Optional)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {value && (
            <span className="text-xs text-green-400 font-medium">
              {value.length} chars
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/60" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] as const }}
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Textarea */}
              <Textarea
                value={value}
                onChange={(e) => {
                  if (e.target.value.length <= characterLimit) {
                    onChange(e.target.value);
                  }
                }}
                placeholder={placeholder}
                className="min-h-[120px] resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-green-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setIsExpanded(false);
                  }
                }}
              />

              {/* Footer */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/40">
                  Press Enter to collapse, Shift+Enter for new line
                </span>
                <span
                  className={`font-medium ${
                    charactersRemaining < 50
                      ? 'text-red-400'
                      : charactersRemaining < 100
                      ? 'text-yellow-400'
                      : 'text-white/60'
                  }`}
                >
                  {charactersRemaining} remaining
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview when collapsed */}
      {!isExpanded && value && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-4"
        >
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-white/60 text-sm line-clamp-2">{value}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
