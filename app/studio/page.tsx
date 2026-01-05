"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { StudioDashboard } from "@/components/studio/views";
import { StudioMainContent } from "@/components/studio/studio-main-content";
import { useStudioData } from "@/hooks/use-studio-data";
import {
  Plus, Sparkles, Layers, DollarSign,
  Package, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function DashboardContent() {
  const { projects, collections, nfts, isLoading, error, refreshData } = useStudioData();
  const [timeRange, setTimeRange] = useState('7d');
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const [isHeroRefAttached, setIsHeroRefAttached] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Callback ref to track when the hero element is attached to the DOM
  const heroRefCallback = (node: HTMLDivElement | null) => {
    heroRef.current = node;
    setIsHeroRefAttached(!!node);
  };

  // Only use target-based scroll tracking after the ref is actually attached
  const { scrollYProgress } = useScroll(
    isHeroRefAttached ? { target: heroRef } : undefined
  );
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

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
            <div className="text-red-500 text-2xl">⚠</div>
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
        // MOBILE LAYOUT - Premium iOS Experience
        <div className="relative min-h-screen">
          {/* Premium Gradient Hero */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[rgb(163,255,18)]/20 via-black to-purple-900/30" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a3ff12' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            {/* Header Content */}
            <div className="relative pt-20 px-4 pb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-[rgb(163,255,18)] text-black font-bold text-xs">STUDIO</Badge>
                  <Badge className="bg-purple-500 text-white font-bold text-xs">DASHBOARD</Badge>
                </div>
                <h1 className="text-4xl font-black text-white mb-2">Create & Manage</h1>
                <p className="text-white/80 text-sm">
                  Your NFT collections at a glance
                </p>
              </motion.div>

              {/* Stats Cards - Inside Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-3 mb-4"
              >
            {/* Projects Card */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-[rgb(163,255,18)]/10 flex items-center justify-center mb-3">
                <Package className="w-5 h-5 text-[rgb(163,255,18)]" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{projects.length}</div>
              <div className="text-sm text-white/60">Projects</div>
            </motion.div>

            {/* Collections Card */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{totalCollections}</div>
              <div className="text-sm text-white/60">Collections</div>
            </motion.div>

            {/* NFTs Card */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{totalNFTs}</div>
              <div className="text-sm text-white/60">NFTs</div>
            </motion.div>

            {/* Revenue Card */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{totalRevenue}</div>
              <div className="text-sm text-white/60">Revenue</div>
            </motion.div>
              </motion.div>

              {/* Primary CTA - Inside Hero */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/studio/create')}
                className="w-full bg-[rgb(163,255,18)] text-black rounded-2xl p-4 font-bold flex items-center justify-center gap-2 min-h-[56px] hover:bg-[rgb(163,255,18)]/90 transition-all shadow-lg shadow-[rgb(163,255,18)]/20"
              >
                <Plus className="w-5 h-5" />
                <span>Create New Collection</span>
              </motion.button>
            </div>
          </div>

          {/* Content Section with proper spacing */}
          <div className="px-4 pb-32 pt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StudioMainContent currentView="dashboard">
                <StudioDashboard
                  mockProjects={projects}
                  mockCollections={collections}
                  mockNFTs={nfts}
                />
              </StudioMainContent>
            </motion.div>
          </div>
        </div>
      ) : (
        // DESKTOP LAYOUT
        <div className="relative">
          {/* Desktop Hero */}
          <motion.div
            ref={heroRefCallback}
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

export default function StudioPage() {
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