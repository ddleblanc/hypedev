"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  formatFn?: (value: number) => string;
}

// Easing function for smooth animation
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

export function AnimatedCounter({
  value,
  duration = 1500,
  decimals = 0,
  suffix = "",
  prefix = "",
  className,
  formatFn,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousValueRef = useRef(0);

  useEffect(() => {
    const startValue = previousValueRef.current;
    const endValue = value;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue = startValue + (endValue - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValueRef.current = endValue;
      }
    };

    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = formatFn
    ? formatFn(displayValue)
    : displayValue.toFixed(decimals);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

// Utility function for compact number formatting
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

// Animated counter with compact number formatting
export function AnimatedCompactCounter({
  value,
  duration = 1500,
  className,
  suffix = "",
  prefix = "",
}: Omit<AnimatedCounterProps, "formatFn" | "decimals">) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      className={className}
      suffix={suffix}
      prefix={prefix}
      formatFn={formatCompactNumber}
    />
  );
}
