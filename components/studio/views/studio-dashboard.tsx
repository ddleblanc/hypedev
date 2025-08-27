"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Sparkles,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface StudioDashboardProps {
  mockProjects: any[];
  mockCollections: any[];
  mockNFTs: any[];
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

// Mock data for charts
const salesData = [
  { month: "Jan", sales: 186, revenue: 2400 },
  { month: "Feb", sales: 305, revenue: 3200 },
  { month: "Mar", sales: 237, revenue: 2800 },
  { month: "Apr", sales: 420, revenue: 4500 },
  { month: "May", sales: 380, revenue: 4200 },
  { month: "Jun", sales: 520, revenue: 5800 },
];

const activityData = [
  { day: "Mon", mints: 120, views: 450, sales: 20 },
  { day: "Tue", mints: 150, views: 520, sales: 35 },
  { day: "Wed", mints: 180, views: 480, sales: 28 },
  { day: "Thu", mints: 200, views: 620, sales: 45 },
  { day: "Fri", mints: 240, views: 750, sales: 60 },
  { day: "Sat", mints: 280, views: 820, sales: 72 },
  { day: "Sun", mints: 220, views: 680, sales: 55 },
];

const categoryData = [
  { name: "Art", value: 35, fill: "rgb(163,255,18)" },
  { name: "Gaming", value: 25, fill: "rgb(59,130,246)" },
  { name: "Music", value: 20, fill: "rgb(147,51,234)" },
  { name: "Sports", value: 15, fill: "rgb(251,146,60)" },
  { name: "Other", value: 5, fill: "rgb(156,163,175)" },
];

export function StudioDashboard({ mockProjects, mockCollections, mockNFTs }: StudioDashboardProps) {
  const quickStats = [
    { 
      title: 'Total Revenue', 
      value: '$45,231', 
      change: '+20.1%', 
      trend: 'up',
      icon: DollarSign, 
      description: 'from last month'
    },
    { 
      title: 'Active Collections', 
      value: mockCollections.length.toString(), 
      change: '+12.5%', 
      trend: 'up',
      icon: Package, 
      description: 'from last month'
    },
    { 
      title: 'Total NFTs', 
      value: mockNFTs.length.toString(), 
      change: '-5.4%', 
      trend: 'down',
      icon: Sparkles, 
      description: 'from last month'
    },
    { 
      title: 'Total Views', 
      value: '12.5K', 
      change: '+34.2%', 
      trend: 'up',
      icon: Eye, 
      description: 'from last month'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-black/40 backdrop-blur-sm border-white/10 hover:border-[rgb(163,255,18)]/30 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-[rgb(163,255,18)]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="flex items-center gap-2 mt-2">
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
                  <p className="text-xs text-white/50">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales & Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-black/40 backdrop-blur-sm border-white/10">
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
          <Card className="bg-black/40 backdrop-blur-sm border-white/10">
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
          <Card className="bg-black/40 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Category Distribution</CardTitle>
              <CardDescription className="text-white/60">
                NFTs by category
              </CardDescription>
            </CardHeader>
            <CardContent>
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
          <Card className="bg-black/40 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Recent Projects</CardTitle>
              <CardDescription className="text-white/60">
                Your latest studio projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProjects.slice(0, 4).map((project, index) => (
                  <div key={project.id || index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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
                  </div>
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
  );
}