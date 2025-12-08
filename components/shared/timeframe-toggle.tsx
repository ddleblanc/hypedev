"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type Timeframe = "24h" | "7d" | "30d";

interface TimeframeToggleProps {
  value: Timeframe;
  onChange: (value: Timeframe) => void;
  className?: string;
  size?: "sm" | "md";
}

const timeframes: { value: Timeframe; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

export function TimeframeToggle({
  value,
  onChange,
  className,
  size = "md",
}: TimeframeToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg p-1",
        "bg-white/5 border border-white/10",
        className
      )}
    >
      {timeframes.map((timeframe) => {
        const isActive = value === timeframe.value;
        return (
          <button
            key={timeframe.value}
            onClick={() => onChange(timeframe.value)}
            className={cn(
              "rounded-md font-medium transition-all duration-200",
              size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
              isActive
                ? "bg-[rgb(163,255,18)] text-black shadow-sm"
                : "text-white/60 hover:text-white hover:bg-white/10"
            )}
          >
            {timeframe.label}
          </button>
        );
      })}
    </div>
  );
}

// Minimal variant for inline use
export function TimeframeSelect({
  value,
  onChange,
  className,
}: Omit<TimeframeToggleProps, "size">) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {timeframes.map((timeframe, index) => {
        const isActive = value === timeframe.value;
        return (
          <React.Fragment key={timeframe.value}>
            {index > 0 && <span className="text-white/20">/</span>}
            <button
              onClick={() => onChange(timeframe.value)}
              className={cn(
                "text-xs font-medium transition-colors",
                isActive
                  ? "text-[rgb(163,255,18)]"
                  : "text-white/40 hover:text-white/60"
              )}
            >
              {timeframe.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
