"use client";

import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { AnimatedCounter, formatCompactNumber } from "@/components/shared/animated-counter";
import { MiniSparkline } from "@/components/shared/mini-sparkline";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  trend?: string;
  trendData?: number[];
  formatValue?: (value: number) => string;
}

export function StatCard({ title, value, change, icon: Icon, trend, trendData, formatValue }: StatCardProps) {
  // Parse numeric value from string if needed
  const numericValue = typeof value === 'number' ? value : parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
  const isEth = typeof value === 'string' && value.includes('ETH');

  return (
    <Card className="bg-black/40 border-white/10 hover:border-white/20 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-white/60">{title}</p>
          {Icon && <Icon className="w-4 h-4 text-white/40" />}
        </div>
        <div className="flex items-center justify-between">
          <AnimatedCounter
            value={numericValue}
            decimals={isEth ? 2 : 0}
            suffix={isEth ? ' ETH' : ''}
            formatFn={!isEth && numericValue >= 1000 ? formatCompactNumber : formatValue}
            className="text-xl font-bold text-white"
          />
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
        {(trendData && trendData.length > 1) ? (
          <div className="mt-2">
            <MiniSparkline
              data={trendData}
              width={100}
              height={32}
              showArea={true}
              color="rgb(163,255,18)"
            />
          </div>
        ) : trend && (
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
