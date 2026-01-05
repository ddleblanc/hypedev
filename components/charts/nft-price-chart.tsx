"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PricePoint {
  timestamp: Date;
  price: number;
  currency: string;
  type: string;
  transactionHash: string | null;
}

interface PriceStats {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  totalSales: number;
  firstSaleDate: Date | null;
  lastSaleDate: Date | null;
  priceChange: number | null;
}

interface NFTPriceChartProps {
  events: PricePoint[];
  stats: PriceStats;
  isLoading?: boolean;
  floorPrice?: number | null;
  currency?: string;
}

type TimeRange = "7d" | "30d" | "90d" | "all";

export function NFTPriceChart({
  events,
  stats,
  isLoading = false,
  floorPrice,
  currency = "ETH",
}: NFTPriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  // Filter events by time range
  const getFilteredEvents = () => {
    if (timeRange === "all") return events;

    const now = new Date();
    const daysMap: Record<TimeRange, number> = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      all: Infinity,
    };
    const cutoff = new Date(now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000);

    return events.filter((e) => new Date(e.timestamp) >= cutoff);
  };

  const filteredEvents = getFilteredEvents();

  // Transform for Recharts
  const chartData = filteredEvents.map((event) => ({
    date: new Date(event.timestamp).getTime(),
    price: event.price,
    type: event.type,
    formattedDate: format(new Date(event.timestamp), "MMM d, yyyy"),
    formattedTime: format(new Date(event.timestamp), "h:mm a"),
  }));

  // Custom tooltip component
  interface TooltipPayloadItem {
    payload: {
      price: number;
      formattedDate: string;
      formattedTime: string;
      type: string;
    };
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadItem[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-popover/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold mb-1">
          {data.price} {currency}
        </p>
        <p className="text-muted-foreground text-xs">{data.formattedDate}</p>
        <p className="text-muted-foreground text-xs">{data.formattedTime}</p>
        <Badge variant="outline" className="mt-2 text-xs capitalize">
          {data.type.replace("_", " ")}
        </Badge>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center h-64 flex flex-col items-center justify-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">No Price History</h3>
          <p className="text-sm text-muted-foreground">
            This NFT has not been sold yet. Price history will appear after the first sale.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Price History
          </CardTitle>

          {/* Time range buttons */}
          <div className="flex gap-1">
            {(["7d", "30d", "90d", "all"] as TimeRange[]).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setTimeRange(range)}
              >
                {range === "all" ? "All" : range}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-4 text-sm flex-wrap">
          <div>
            <span className="text-muted-foreground">Avg: </span>
            <span className="font-semibold">
              {stats.avgPrice.toFixed(3)} {currency}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Min: </span>
            <span className="font-semibold">
              {stats.minPrice.toFixed(3)} {currency}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Max: </span>
            <span className="font-semibold">
              {stats.maxPrice.toFixed(3)} {currency}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Sales: </span>
            <span className="font-semibold">{stats.totalSales}</span>
          </div>
          {stats.priceChange !== null && (
            <div className="flex items-center gap-1">
              {stats.priceChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={cn(
                  "font-semibold",
                  stats.priceChange >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {stats.priceChange >= 0 ? "+" : ""}
                {stats.priceChange.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />

              <XAxis
                dataKey="date"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />

              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(value) => `${value}`}
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                width={50}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Floor price reference line */}
              {floorPrice && (
                <ReferenceLine
                  y={floorPrice}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label={{
                    value: `Floor: ${floorPrice}`,
                    position: "right",
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                  }}
                />
              )}

              {/* Area under the line */}
              <Area
                type="monotone"
                dataKey="price"
                stroke="transparent"
                fill="url(#priceGradient)"
              />

              {/* Price line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{
                  fill: "hsl(var(--primary))",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  fill: "hsl(var(--primary))",
                  strokeWidth: 0,
                  r: 6,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart legend/info */}
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-4 rounded bg-primary" />
              <span>Sale Price</span>
            </div>
            {floorPrice && (
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-4 border-t-2 border-dashed border-muted-foreground" />
                <span>Floor Price</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Info className="h-3 w-3" />
            <span>Hover for details</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
