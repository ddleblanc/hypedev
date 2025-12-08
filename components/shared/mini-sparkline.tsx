"use client";

import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/utils";

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
  className?: string;
  trend?: "up" | "down" | "neutral";
}

export function MiniSparkline({
  data,
  width = 80,
  height = 24,
  color,
  showArea = true,
  className,
  trend,
}: MiniSparklineProps) {
  // Calculate trend if not provided
  const calculatedTrend = useMemo(() => {
    if (trend) return trend;
    if (data.length < 2) return "neutral";
    const first = data[0];
    const last = data[data.length - 1];
    if (last > first * 1.01) return "up";
    if (last < first * 0.99) return "down";
    return "neutral";
  }, [data, trend]);

  // Determine color based on trend
  const strokeColor = useMemo(() => {
    if (color) return color;
    switch (calculatedTrend) {
      case "up":
        return "#22c55e"; // green-500
      case "down":
        return "#ef4444"; // red-500
      default:
        return "#6b7280"; // gray-500
    }
  }, [color, calculatedTrend]);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    return data.map((value, index) => ({ value, index }));
  }, [data]);

  if (data.length < 2) {
    return (
      <div
        className={cn("flex items-center justify-center text-white/30 text-xs", className)}
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        {showArea ? (
          <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id={`gradient-${strokeColor}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={1.5}
              fill={`url(#gradient-${strokeColor})`}
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// Simple SVG sparkline for ultra-lightweight use (no Recharts dependency)
export function SimpleSvgSparkline({
  data,
  width = 80,
  height = 24,
  className,
  trend,
}: Omit<MiniSparklineProps, "showArea" | "color">) {
  const calculatedTrend = useMemo(() => {
    if (trend) return trend;
    if (data.length < 2) return "neutral";
    const first = data[0];
    const last = data[data.length - 1];
    if (last > first * 1.01) return "up";
    if (last < first * 0.99) return "down";
    return "neutral";
  }, [data, trend]);

  const strokeColor = useMemo(() => {
    switch (calculatedTrend) {
      case "up":
        return "#22c55e";
      case "down":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  }, [calculatedTrend]);

  const pathData = useMemo(() => {
    if (data.length < 2) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * effectiveWidth;
      const y = padding + effectiveHeight - ((value - min) / range) * effectiveHeight;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <div
        className={cn("flex items-center justify-center text-white/30 text-xs", className)}
        style={{ width, height }}
      >
        —
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
