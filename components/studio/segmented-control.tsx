"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LayoutGrid, List, Grid3X3 } from "lucide-react";

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  fullWidth?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
  fullWidth = false,
}: SegmentedControlProps<T>) {
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  };

  const paddingClasses = {
    sm: "px-2.5",
    md: "px-3",
    lg: "px-4",
  };

  return (
    <div
      className={cn(
        "relative inline-flex rounded-lg bg-white/5 p-1 border border-white/10",
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
    >
      {/* Animated background pill */}
      <motion.div
        className="absolute inset-y-1 rounded-md bg-[rgb(163,255,18)]/20 border border-[rgb(163,255,18)]/30"
        initial={false}
        animate={{
          left: `calc(${(selectedIndex / options.length) * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
      />

      {/* Options */}
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative z-10 flex items-center justify-center gap-1.5 rounded-md transition-colors",
            "flex-1 min-w-0",
            paddingClasses[size],
            option.value === value
              ? "text-[rgb(163,255,18)]"
              : "text-white/60 hover:text-white/80"
          )}
        >
          {option.icon}
          <span className="truncate">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

// View mode toggle (grid/list) - commonly used
export function ViewModeToggle({
  value,
  onChange,
  size = "sm",
  className,
}: {
  value: "grid" | "list";
  onChange: (value: "grid" | "list") => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <SegmentedControl
      options={[
        { value: "grid" as const, label: "", icon: <LayoutGrid className="w-4 h-4" /> },
        { value: "list" as const, label: "", icon: <List className="w-4 h-4" /> },
      ]}
      value={value}
      onChange={onChange}
      size={size}
      className={className}
    />
  );
}

// Status filter toggle - commonly used in Studio
export function StatusFilter({
  value,
  onChange,
  size = "sm",
  className,
}: {
  value: "all" | "live" | "draft" | "paused";
  onChange: (value: "all" | "live" | "draft" | "paused") => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <SegmentedControl
      options={[
        { value: "all" as const, label: "All" },
        { value: "live" as const, label: "Live" },
        { value: "draft" as const, label: "Draft" },
        { value: "paused" as const, label: "Paused" },
      ]}
      value={value}
      onChange={onChange}
      size={size}
      className={className}
    />
  );
}

// Date range filter
export function DateRangeFilter({
  value,
  onChange,
  size = "sm",
  className,
}: {
  value: "7d" | "30d" | "90d" | "1y" | "all";
  onChange: (value: "7d" | "30d" | "90d" | "1y" | "all") => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <SegmentedControl
      options={[
        { value: "7d" as const, label: "7d" },
        { value: "30d" as const, label: "30d" },
        { value: "90d" as const, label: "90d" },
        { value: "1y" as const, label: "1y" },
        { value: "all" as const, label: "All" },
      ]}
      value={value}
      onChange={onChange}
      size={size}
      className={className}
    />
  );
}

// Icon-only segmented control (for compact spaces)
export function IconSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; icon: React.ReactNode; tooltip?: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  return (
    <div
      className={cn(
        "relative inline-flex rounded-lg bg-white/5 p-1 border border-white/10",
        className
      )}
    >
      {/* Animated background pill */}
      <motion.div
        className="absolute inset-y-1 rounded-md bg-[rgb(163,255,18)]/20 border border-[rgb(163,255,18)]/30"
        initial={false}
        animate={{
          left: `calc(${(selectedIndex / options.length) * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 30,
        }}
      />

      {/* Options */}
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          title={option.tooltip}
          className={cn(
            "relative z-10 flex items-center justify-center w-9 h-8 rounded-md transition-colors",
            option.value === value
              ? "text-[rgb(163,255,18)]"
              : "text-white/60 hover:text-white/80"
          )}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

// Tab bar (for larger navigation contexts)
export function TabBar<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string; count?: number; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            tab.value === value
              ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border border-[rgb(163,255,18)]/30"
              : "text-white/60 hover:text-white/80 hover:bg-white/5"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                tab.value === value
                  ? "bg-[rgb(163,255,18)]/30 text-[rgb(163,255,18)]"
                  : "bg-white/10 text-white/50"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
