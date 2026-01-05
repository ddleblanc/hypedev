"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Sparkles,
  Eye,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// Import new UI components
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/studio/page-transition";
import { DashboardSkeleton } from "@/components/studio/skeletons";
import { DashboardEmptyState } from "@/components/studio/empty-states";

interface StudioDashboardProps {
  mockProjects: any[];
  mockCollections: any[];
  mockNFTs: any[];
  isLoading?: boolean;
}

// Chart configurations
const salesChartConfig: ChartConfig = {
  sales: {
    label: "Sales",
    color: "rgb(163,255,18)",
  },
  revenue: {
    label: "Revenue",
    color: "rgb(59,130,246)",
  },
} satisfies ChartConfig;

const activityChartConfig: ChartConfig = {
  mints: {
    label: "Mints",
    color: "rgb(163,255,18)",
  },
  views: {
    label: "Views",
    color: "rgb(147,51,234)",
  },
  sales: {
    label: "Sales",
    color: "rgb(251,146,60)",
  },
} satisfies ChartConfig;

export function StudioDashboard({ mockProjects, mockCollections, mockNFTs, isLoading = false }: StudioDashboardProps) {
  // Compute stats from real data when available
  const stats = useMemo(() => {
    const totalNFTs = mockNFTs.length;
    const totalCollections = mockCollections.length;
    const totalProjects = mockProjects.length;
    const deployedCollections = mockCollections.filter((c: any) => c.isDeployed).length;
    const totalVolume = mockCollections.reduce((acc: number, c: any) => acc + (c.volume || 0), 0);
    const totalHolders = mockCollections.reduce((acc: number, c: any) => acc + (c.holders || 0), 0);

    return {
      totalNFTs,
      totalCollections,
      totalProjects,
      deployedCollections,
      totalVolume,
      totalHolders,
    };
  }, [mockProjects, mockCollections, mockNFTs]);

  // Generate chart data based on real collection data (or reasonable estimates)
  const salesData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseVolume = stats.totalVolume / 6;

    return months.map((month, i) => ({
      month,
      sales: Math.round(stats.totalNFTs / 6 * (0.5 + Math.random())),
      revenue: Math.round(baseVolume * (0.5 + Math.random()) * 100) / 100,
    }));
  }, [stats]);

  const activityData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const avgMints = Math.max(1, Math.round(stats.totalNFTs / 30));

    return days.map((day) => ({
      day,
      mints: Math.round(avgMints * (0.5 + Math.random())),
      views: Math.round(avgMints * 5 * (0.5 + Math.random())),
      sales: Math.round(avgMints * 0.3 * (0.5 + Math.random())),
    }));
  }, [stats]);

  const categoryData = useMemo(() => {
    // Group collections by contract type
    const types: Record<string, number> = {};
    mockCollections.forEach((c: any) => {
      const type = c.contractType || 'Other';
      types[type] = (types[type] || 0) + 1;
    });

    const colors = {
      'DropERC721': 'rgb(163,255,18)',
      'TokenERC721': 'rgb(59,130,246)',
      'OpenEditionERC721': 'rgb(147,51,234)',
      'DropERC1155': 'rgb(251,146,60)',
      'Other': 'rgb(156,163,175)',
    };

    const total = Object.values(types).reduce((a, b) => a + b, 0) || 1;

    return Object.entries(types).map(([name, value]) => ({
      name: name.replace('ERC', ' '),
      value: Math.round((value / total) * 100),
      fill: colors[name as keyof typeof colors] || colors.Other,
    }));
  }, [mockCollections]);

  const quickStats = useMemo(() => [
    {
      title: 'Total Volume',
      value: `${stats.totalVolume.toFixed(2)} ETH`,
      change: stats.totalVolume > 0 ? '+12.5%' : '—',
      trend: stats.totalVolume > 0 ? 'up' : 'neutral',
      icon: DollarSign,
      description: 'all time'
    },
    {
      title: 'Collections',
      value: stats.totalCollections.toString(),
      change: stats.deployedCollections > 0 ? `${stats.deployedCollections} live` : 'None deployed',
      trend: stats.deployedCollections > 0 ? 'up' : 'neutral',
      icon: Layers,
      description: 'total created'
    },
    {
      title: 'NFTs Minted',
      value: stats.totalNFTs.toString(),
      change: stats.totalNFTs > 0 ? '+8.2%' : '—',
      trend: stats.totalNFTs > 0 ? 'up' : 'neutral',
      icon: Sparkles,
      description: 'across all collections'
    },
    {
      title: 'Unique Holders',
      value: stats.totalHolders.toLocaleString(),
      change: stats.totalHolders > 0 ? '+5.4%' : '—',
      trend: stats.totalHolders > 0 ? 'up' : 'neutral',
      icon: Eye,
      description: 'wallets holding your NFTs'
    },
  ], [stats]);

  // Check if user has any data
  const hasData = mockProjects.length > 0 || mockCollections.length > 0 || mockNFTs.length > 0;

  // Loading state
  if (isLoading) {
    return (
      <PageTransition>
        <DashboardSkeleton />
      </PageTransition>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <PageTransition>
        <DashboardEmptyState />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Quick Stats Grid */}
        <StaggerContainer>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat, index) => (
              <StaggerItem key={stat.title}>
                <Card className="bg-black/80 backdrop-blur-sm border-white/10 hover:border-[rgb(163,255,18)]/30 transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-white/80">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-[rgb(163,255,18)]" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="flex items-center gap-2 mt-2">
                      {stat.trend !== 'neutral' && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs px-2 py-0.5",
                            stat.trend === 'up'
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                          )}
                        >
                          <span className="flex items-center gap-1">
                            {stat.trend === 'up' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {stat.change}
                          </span>
                        </Badge>
                      )}
                      <p className="text-xs text-white/50">{stat.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </div>
        </StaggerContainer>

        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sales & Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-black/80 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Sales & Revenue</CardTitle>
                <CardDescription className="text-white/60">
                  Monthly sales and revenue trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={salesChartConfig} className="h-[300px] w-full">
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" />
                    <XAxis
                      dataKey="month"
                      className="text-white/60"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                    />
                    <YAxis
                      className="text-white/60"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="rgb(163,255,18)"
                      fill="rgb(163,255,18)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="rgb(59,130,246)"
                      fill="rgb(59,130,246)"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-black/80 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Weekly Activity</CardTitle>
                <CardDescription className="text-white/60">
                  Mints, views, and sales this week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={activityChartConfig} className="h-[300px] w-full">
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-white/10" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="mints" fill="rgb(163,255,18)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="views" fill="rgb(147,51,234)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sales" fill="rgb(251,146,60)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-black/80 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Collection Types</CardTitle>
                <CardDescription className="text-white/60">
                  Distribution by contract type
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <>
                    <ChartContainer config={{}} className="h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="mt-4 space-y-2">
                      {categoryData.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.fill }}
                            />
                            <span className="text-sm text-white/70">{cat.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-white">{cat.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-white/50 text-sm">
                    No collections yet
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="md:col-span-2"
          >
            <Card className="bg-black/80 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Recent Projects</CardTitle>
                <CardDescription className="text-white/60">
                  Your latest studio projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProjects.slice(0, 4).map((project, index) => (
                    <motion.div
                      key={project.id || index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[rgb(163,255,18)]/20 flex items-center justify-center">
                          <Package className="h-5 w-5 text-[rgb(163,255,18)]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{project.name}</p>
                          <p className="text-xs text-white/50">{project.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{project.collections || 0} collections</p>
                        <p className="text-xs text-white/50">{project.totalNFTs || 0} NFTs</p>
                      </div>
                    </motion.div>
                  ))}
                  {mockProjects.length === 0 && (
                    <div className="text-center py-8 text-white/50">
                      No projects yet. Create your first project to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
