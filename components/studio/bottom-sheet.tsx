"use client";

import { ReactNode, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  PanInfo,
  useDragControls,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  showCloseButton?: boolean;
  maxHeight?: string;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  description,
  showCloseButton = true,
  maxHeight = "90vh",
  className,
}: BottomSheetProps) {
  const dragControls = useDragControls();

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle keyboard escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      // Close if dragged down past threshold or with velocity
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            style={{ maxHeight }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50",
              "bg-black/95 border-t border-white/10 rounded-t-2xl",
              "overflow-hidden flex flex-col",
              className
            )}
          >
            {/* Handle */}
            <div
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing flex-shrink-0"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 pb-4 border-b border-white/10 flex-shrink-0">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-white/60 mt-0.5">{description}</p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Quick actions bottom sheet for mobile
interface QuickAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export function MobileQuickActions({
  open,
  onClose,
  actions,
  title,
}: {
  open: boolean;
  onClose: () => void;
  actions: QuickAction[];
  title?: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title} maxHeight="50vh">
      <div className="space-y-1 py-2">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => {
              if (!action.disabled) {
                action.onClick();
                onClose();
              }
            }}
            disabled={action.disabled}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left",
              "transition-colors",
              action.disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-white/10 active:bg-white/15",
              action.destructive && !action.disabled && "text-red-400"
            )}
          >
            <span
              className={cn(
                action.destructive ? "text-red-400" : "text-white/60"
              )}
            >
              {action.icon}
            </span>
            <span className="text-white">{action.label}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

// Confirmation bottom sheet
export function ConfirmationSheet({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} showCloseButton={false} maxHeight="40vh">
      <div className="pt-4 pb-2 text-center">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-sm text-white/60 mt-2 max-w-sm mx-auto">
            {description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn(
            "w-full py-3 rounded-xl font-medium transition-colors",
            destructive
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
          )}
        >
          {confirmLabel}
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-medium bg-white/10 text-white hover:bg-white/15 transition-colors"
        >
          {cancelLabel}
        </button>
      </div>
    </BottomSheet>
  );
}

// Filter bottom sheet for mobile
interface FilterOption {
  id: string;
  label: string;
  selected: boolean;
}

interface FilterSection {
  title: string;
  options: FilterOption[];
  onToggle: (id: string) => void;
  multiSelect?: boolean;
}

export function FilterSheet({
  open,
  onClose,
  sections,
  onReset,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  sections: FilterSection[];
  onReset?: () => void;
  onApply?: () => void;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title="Filters" maxHeight="80vh">
      <div className="space-y-6 pt-4">
        {sections.map((section, i) => (
          <div key={i}>
            <h4 className="text-sm font-medium text-white/60 mb-3">
              {section.title}
            </h4>
            <div className="flex flex-wrap gap-2">
              {section.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => section.onToggle(option.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    option.selected
                      ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border border-[rgb(163,255,18)]/30"
                      : "bg-white/5 text-white/60 border border-white/10 hover:border-white/20"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8">
        {onReset && (
          <button
            onClick={onReset}
            className="flex-1 py-3 rounded-xl font-medium bg-white/10 text-white hover:bg-white/15 transition-colors"
          >
            Reset
          </button>
        )}
        <button
          onClick={() => {
            onApply?.();
            onClose();
          }}
          className="flex-1 py-3 rounded-xl font-medium bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 transition-colors"
        >
          Apply
        </button>
      </div>
    </BottomSheet>
  );
}
