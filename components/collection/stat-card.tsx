"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon?: LucideIcon;
  trend?: string;
}

export function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-white/60">{title}</p>
          {Icon && <Icon className="w-4 h-4 text-white/40" />}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-sm ${
              change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-white/60'
            }`}>
              {change > 0 ? <ArrowUpRight className="w-4 h-4" /> :
               change < 0 ? <ArrowDownRight className="w-4 h-4" /> : null}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-2 h-8">
            <svg className="w-full h-full" viewBox="0 0 100 30">
              <polyline
                fill="none"
                stroke="rgb(163,255,18)"
                strokeWidth="2"
                points={trend}
                opacity="0.5"
              />
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
