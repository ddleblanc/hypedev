"use client";

import { cn } from "@/lib/utils";

// Base skeleton with shimmer animation
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white/5",
        "before:absolute before:inset-0",
        "before:-translate-x-full",
        "before:animate-shimmer",
        "before:bg-gradient-to-r",
        "before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

// Project card skeleton
export function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm p-4 space-y-4">
      {/* Banner */}
      <Skeleton className="w-full h-32 rounded-lg" />

      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// Collection card skeleton
export function CollectionCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm overflow-hidden">
      {/* Image */}
      <Skeleton className="w-full aspect-square" />

      {/* Content */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-12 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// NFT card skeleton
export function NFTCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm overflow-hidden">
      {/* Image */}
      <Skeleton className="w-full aspect-square" />

      {/* Content */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Dashboard stats skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm p-4 space-y-2"
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

// Chart skeleton
export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Chart area - bar chart simulation */}
      <div className="h-64 flex items-end gap-2 pt-4">
        {[...Array(12)].map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${30 + Math.sin(i * 0.5) * 20 + i * 5}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Area chart skeleton
export function AreaChartSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Chart area - wave simulation */}
      <div className="h-[300px] relative">
        <div className="absolute inset-0 flex flex-col justify-end">
          <Skeleton className="h-full w-full rounded-lg opacity-50" />
        </div>
      </div>
    </div>
  );
}

// Pie chart skeleton
export function PieChartSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm p-4">
      {/* Header */}
      <div className="space-y-1 mb-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Chart area */}
      <div className="flex justify-center py-4">
        <Skeleton className="w-40 h-40 rounded-full" />
      </div>

      {/* Legend */}
      <div className="space-y-2 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/10">
      <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// Activity item skeleton
export function ActivityItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

// Recent projects skeleton (for dashboard)
export function RecentProjectsSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm p-4">
      {/* Header */}
      <div className="space-y-1 mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>

      {/* Project rows */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="text-right space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Grid skeleton wrapper
export function GridSkeleton({
  count = 6,
  Skeleton: SkeletonComponent,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}: {
  count?: number;
  Skeleton: React.ComponentType;
  columns?: string;
}) {
  return (
    <div className={cn("grid gap-4", columns)}>
      {[...Array(count)].map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

// List skeleton wrapper
export function ListSkeleton({
  count = 5,
  Skeleton: SkeletonComponent,
}: {
  count?: number;
  Skeleton: React.ComponentType;
}) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
}

// Full dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <DashboardStatsSkeleton />

      {/* Charts row */}
      <div className="grid gap-6 md:grid-cols-2">
        <AreaChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Bottom row */}
      <div className="grid gap-6 md:grid-cols-3">
        <PieChartSkeleton />
        <div className="md:col-span-2">
          <RecentProjectsSkeleton />
        </div>
      </div>
    </div>
  );
}
