"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ItemCardSkeletonProps {
  className?: string;
}

export function ItemCardSkeleton({ className }: ItemCardSkeletonProps) {
  return (
    <Card className={cn(
      "bg-black/40 border-white/10 border-l-4 border-l-gray-600 animate-pulse overflow-hidden",
      className
    )}>
      <div className="aspect-square bg-white/5" />
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-8" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-3 bg-white/5 rounded w-12" />
            <div className="h-4 bg-white/10 rounded w-16" />
          </div>
          <div className="space-y-1 text-right">
            <div className="h-3 bg-white/5 rounded w-12 ml-auto" />
            <div className="h-3 bg-white/10 rounded w-14 ml-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ItemCardSkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </>
  );
}
