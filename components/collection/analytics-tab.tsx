"use client";

import { useState, useMemo } from "react";
import { Sparkles, TrendingUp, Users, Diamond } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TimeframeToggle, type Timeframe } from "@/components/shared/timeframe-toggle";

// Generate mock data for charts based on timeframe
function generateMockData(timeframe: Timeframe) {
  const dataPoints = timeframe === "24h" ? 24 : timeframe === "7d" ? 7 : 30;
  const basePrice = 1.5;
  const baseVolume = 50;

  return Array.from({ length: dataPoints }, (_, i) => {
    const variation = Math.sin(i * 0.5) * 0.3 + Math.random() * 0.2;
    return {
      date: timeframe === "24h" ? `${i}h` : timeframe === "7d" ? `Day ${i + 1}` : `${i + 1}`,
      price: Number((basePrice + variation).toFixed(2)),
      volume: Number((baseVolume + Math.random() * 40 - 20).toFixed(1)),
      sales: Math.floor(Math.random() * 20 + 5),
    };
  });
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-black/90 border border-white/20 rounded-lg p-3 backdrop-blur-sm">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      {payload.map((item: any, index: number) => (
        <p key={index} className="text-white font-medium text-sm">
          {item.name}: {item.value} {item.name === "volume" || item.name === "price" ? "ETH" : ""}
        </p>
      ))}
    </div>
  );
}

// Holder distribution data
const holderDistribution = [
  { range: "1 item", count: 4250, percentage: 65 },
  { range: "2-5 items", count: 1625, percentage: 25 },
  { range: "6-10 items", count: 455, percentage: 7 },
  { range: "10+ items", count: 195, percentage: 3 },
];

export function AnalyticsTab() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("7d");

  // Memoize chart data to prevent recalculation
  const chartData = useMemo(() => generateMockData(selectedTimeframe), [selectedTimeframe]);

  return (
    <TabsContent value="analytics" className="mt-0 space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Performance Analytics</h3>
        <TimeframeToggle
          value={selectedTimeframe}
          onChange={setSelectedTimeframe}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Chart */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Floor Price History</CardTitle>
            <CardDescription className="text-white/60">
              Price movement over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={256}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(163,255,18)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="rgb(163,255,18)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#ffffff40"
                  tick={{ fill: "#ffffff60", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#ffffff40"
                  tick={{ fill: "#ffffff60", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value} ETH`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="rgb(163,255,18)"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  isAnimationActive={true}
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volume Chart */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Trading Volume</CardTitle>
            <CardDescription className="text-white/60">
              Daily volume in ETH
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#ffffff40"
                  tick={{ fill: "#ffffff60", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#ffffff40"
                  tick={{ fill: "#ffffff60", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="volume"
                  fill="url(#volumeGradient)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={500}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales Distribution */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Sales Activity</CardTitle>
            <CardDescription className="text-white/60">
              Number of sales over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  stroke="#ffffff40"
                  tick={{ fill: "#ffffff60", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#ffffff40"
                  tick={{ fill: "#ffffff60", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ fill: "#a855f7", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: "#a855f7" }}
                  isAnimationActive={true}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Holder Distribution */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Holder Distribution</CardTitle>
            <CardDescription className="text-white/60">
              Distribution of items among holders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holderDistribution.map((item) => (
                <div key={item.range} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">{item.range}</span>
                    <span className="text-white/60">{item.count.toLocaleString()} ({item.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[rgb(163,255,18)]" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Rising Floor Price</p>
                <p className="text-xs text-white/60">Floor increased 24% in last 7 days</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Growing Community</p>
                <p className="text-xs text-white/60">312 new holders this week</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Diamond className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Rare Items Trading</p>
                <p className="text-xs text-white/60">Mythic items averaging 45 ETH</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
