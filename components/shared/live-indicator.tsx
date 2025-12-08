"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  variant?: "pulse" | "glow" | "minimal";
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: { dot: "h-1.5 w-1.5", text: "text-xs" },
  md: { dot: "h-2 w-2", text: "text-sm" },
  lg: { dot: "h-2.5 w-2.5", text: "text-base" },
};

export function LiveIndicator({
  variant = "pulse",
  label,
  className,
  size = "md",
}: LiveIndicatorProps) {
  const sizes = sizeClasses[size];

  if (variant === "minimal") {
    return (
      <span className={cn("relative flex", sizes.dot, className)}>
        <span className="relative inline-flex rounded-full bg-green-500" style={{ width: "100%", height: "100%" }} />
      </span>
    );
  }

  if (variant === "glow") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className={cn("relative flex", sizes.dot)}>
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75",
              "animate-ping"
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full bg-green-500",
              "shadow-[0_0_10px_rgba(34,197,94,0.8)]"
            )}
            style={{ width: "100%", height: "100%" }}
          />
        </span>
        {label && (
          <span className={cn("text-white/60", sizes.text)}>{label}</span>
        )}
      </div>
    );
  }

  // Default: pulse variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("relative flex", sizes.dot)}>
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75",
            "animate-ping"
          )}
        />
        <span
          className="relative inline-flex rounded-full bg-green-500"
          style={{ width: "100%", height: "100%" }}
        />
      </span>
      {label && (
        <span className={cn("text-white/60", sizes.text)}>{label}</span>
      )}
    </div>
  );
}

// Animated dot for activity indicators
export function ActivityDot({
  type,
  className,
}: {
  type: "sale" | "listing" | "bid" | "mint" | "transfer";
  className?: string;
}) {
  const colors = {
    sale: "bg-green-500",
    listing: "bg-blue-500",
    bid: "bg-purple-500",
    mint: "bg-[rgb(163,255,18)]",
    transfer: "bg-gray-500",
  };

  return (
    <span className={cn("relative flex h-2 w-2", className)}>
      <span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
          colors[type]
        )}
      />
      <span
        className={cn("relative inline-flex rounded-full h-2 w-2", colors[type])}
      />
    </span>
  );
}
