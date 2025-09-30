"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, Users, Diamond } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export function AnalyticsTab() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  return (
    <TabsContent value="analytics" className="mt-0 space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Performance Analytics</h3>
        <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
          <SelectTrigger className="w-32 bg-black/40 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
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
            <div className="h-64 flex items-center justify-center text-white/40">
              [Price Chart Visualization]
            </div>
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
            <div className="h-64 flex items-center justify-center text-white/40">
              [Volume Chart Visualization]
            </div>
          </CardContent>
        </Card>

        {/* Sales Distribution */}
        <Card className="bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Sales Distribution</CardTitle>
            <CardDescription className="text-white/60">
              Price distribution of recent sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-white/40">
              [Distribution Chart]
            </div>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">1 item</span>
                <div className="flex items-center gap-2">
                  <Progress value={65} className="w-32 h-2 bg-white/10" />
                  <span className="text-xs text-white/60 w-12 text-right">65%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">2-5 items</span>
                <div className="flex items-center gap-2">
                  <Progress value={25} className="w-32 h-2 bg-white/10" />
                  <span className="text-xs text-white/60 w-12 text-right">25%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">6-10 items</span>
                <div className="flex items-center gap-2">
                  <Progress value={7} className="w-32 h-2 bg-white/10" />
                  <span className="text-xs text-white/60 w-12 text-right">7%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">10+ items</span>
                <div className="flex items-center gap-2">
                  <Progress value={3} className="w-32 h-2 bg-white/10" />
                  <span className="text-xs text-white/60 w-12 text-right">3%</span>
                </div>
              </div>
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
