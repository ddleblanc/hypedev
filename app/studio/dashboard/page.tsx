"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { StudioDashboard } from "@/components/studio/views";
import { StudioMainContent } from "@/components/studio/studio-main-content";
import { useStudioData } from "@/hooks/use-studio-data";
import {
  Plus, ArrowLeft, Sparkles, Layers, DollarSign,
  Package, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function DashboardContent() {
  const { projects, collections, nfts, isLoading, error, refreshData } = useStudioData();
  const [timeRange, setTimeRange] = useState('7d');
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const totalCollections = collections.length;
  const totalNFTs = nfts.length;
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const totalRevenue = "12.4 ETH"; // Mock data
  const totalViews = "47.2K"; // Mock data
  const conversionRate = "3.2%"; // Mock data

  const timeRanges = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: '1y', label: '1 Year' }
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <div className="text-red-500 text-2xl">�</div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Dashboard</h3>
          <p className="text-sm text-white/60 mb-4">{error}</p>
          <Button onClick={refreshData} className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(163,255,18)]"></div>
          <p className="text-white/60 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-black"
    >
      {isMobile ? (
        // MOBILE LAYOUT
        <div className="relative">
          {/* Mobile Hero */}
          <div className="relative h-[60vh] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgb(163,255,18)]/20 via-black to-purple-900/20" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a3ff12' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
              <Button size="icon" variant="ghost" className="bg-black/40 backdrop-blur text-white" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Button size="icon" variant="ghost" className="bg-black/40 backdrop-blur text-white">
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-[rgb(163,255,18)] text-black font-bold text-xs">DASHBOARD</Badge>
                <Badge className="bg-purple-500 text-white font-bold text-xs">OVERVIEW</Badge>
              </div>

              <h1 className="text-4xl font-black text-white mb-2">Studio Dashboard</h1>
              <p className="text-white/80 text-sm mb-4">Monitor your performance and growth</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-[rgb(163,255,18)]/20">
                        <Package className="w-4 h-4 text-[rgb(163,255,18)]" />
                      </div>
                      <div>
                        <p className="text-xs text-white/60">Projects</p>
                        <p className="text-lg font-bold text-white">{projects.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-purple-500/20">
                        <Layers className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/60">Collections</p>
                        <p className="text-lg font-bold text-white">{totalCollections}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-blue-500/20">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/60">NFTs</p>
                        <p className="text-lg font-bold text-white">{totalNFTs}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur border-white/10">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-green-500/20">
                        <DollarSign className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-white/60">Revenue</p>
                        <p className="text-lg font-bold text-white">{totalRevenue}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Time Range Tabs */}
          <div className="sticky top-0 z-30 bg-black border-b border-white/10">
            <div className="flex">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                    timeRange === range.id ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {range.label}
                  {timeRange === range.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(163,255,18)]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Content */}
          <div className="min-h-screen pb-20 bg-black">
            <div className="flex-1 overflow-hidden pt-4">
              <StudioMainContent currentView="dashboard">
                <StudioDashboard
                  mockProjects={projects}
                  mockCollections={collections}
                  mockNFTs={nfts}
                />
              </StudioMainContent>
            </div>
          </div>
        </div>
      ) : (
        // DESKTOP LAYOUT
        <div className="relative">
          {/* Desktop Hero */}
          <motion.div
            ref={heroRef}
            className="relative h-[40vh] overflow-hidden"
            style={{ scale: heroScale }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgb(163,255,18)]/30 via-black to-purple-900/30" />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a3ff12' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <motion.div style={{ opacity: heroOpacity }} className="absolute bottom-0 left-0 right-0 px-8 py-8">
              <div className="max-w-7xl">
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-3 mb-4">
                  <Badge className="bg-[rgb(163,255,18)] text-black font-bold">DASHBOARD</Badge>
                  <Badge variant="outline" className="border-white/30 text-white">OVERVIEW</Badge>
                </motion.div>

                <motion.h1 initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-5xl md:text-6xl font-bold text-white mb-4">
                  Studio Dashboard
                </motion.h1>

                <motion.p initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="text-lg text-white/90 mb-6 max-w-2xl">
                  Monitor your NFT projects, track performance metrics, and grow your creative business
                </motion.p>

                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-4">
                  <Button className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90 font-bold px-6 py-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-6 py-3">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Desktop Sticky Header */}
          <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-lg border-b border-white/10">
            <div className="px-8 py-4 max-w-7xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-sm text-white/60">Total Projects</p>
                    <p className="text-2xl font-bold text-white">{projects.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Active</p>
                    <p className="text-2xl font-bold text-[rgb(163,255,18)]">{activeProjects}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">{totalRevenue}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Views</p>
                    <p className="text-2xl font-bold text-white">{totalViews}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Conversion</p>
                    <p className="text-2xl font-bold text-white">{conversionRate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {timeRanges.map((range) => (
                      <Button
                        key={range.id}
                        size="sm"
                        variant={timeRange === range.id ? 'default' : 'ghost'}
                        onClick={() => setTimeRange(range.id)}
                        className="text-white"
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Content */}
          <div className="px-8 py-8 min-h-screen max-w-7xl">
            <StudioMainContent currentView="dashboard">
              <StudioDashboard
                mockProjects={projects}
                mockCollections={collections}
                mockNFTs={nfts}
              />
            </StudioMainContent>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function StudioDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(163,255,18)]"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}