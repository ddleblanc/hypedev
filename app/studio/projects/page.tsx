"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { StudioProjects } from "@/components/studio/views";
import { StudioMainContent } from "@/components/studio/studio-main-content";
import { useStudioData } from "@/hooks/use-studio-data";
import {
  Plus, Grid3x3, List, Search, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function ProjectsContent() {
  const { projects, isLoading, error, refreshData } = useStudioData();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const tabs = [
    { id: 'all', label: 'All Projects', count: projects.length },
    { id: 'active', label: 'Active', count: projects.filter((p: any) => p.status === 'active').length },
    { id: 'drafts', label: 'Drafts', count: projects.filter((p: any) => p.status === 'draft').length }
  ];

  const totalCollections = projects.reduce((acc: number, p: any) => acc + (p.collections || 0), 0);
  const totalNFTs = projects.reduce((acc: number, p: any) => acc + (p.totalNFTs || 0), 0);
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <div className="text-red-500 text-2xl">⚠</div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Projects</h3>
          <p className="text-sm text-white/60 mb-4">{error}</p>
          <Button onClick={refreshData} className="bg-white/10 border border-white/20 text-white hover:bg-white/20">
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
      {!isClient ? (
        // Show loading skeleton during hydration
        <div className="relative">
          <div className="h-[50vh] md:h-[40vh] bg-gradient-to-br from-black/60 via-black to-[rgb(163,255,18)]/30 animate-pulse" />
          <div className="sticky top-16 md:top-0 z-30 bg-black/95 backdrop-blur-lg border-b border-white/10 p-4">
            <div className="h-8 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="px-4 md:px-8 py-6 md:py-8 min-h-screen">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white/5 rounded-2xl h-64 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ) : (
      <div className="relative">
        {/* Hero Section - Responsive */}
        <motion.div
          ref={heroRef}
          className="relative h-[50vh] md:h-[40vh] overflow-hidden"
          style={{ scale: isClient ? heroScale : 1 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[rgb(163,255,18)]/30 via-black to-black/60" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a3ff12' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          <motion.div style={{ opacity: heroOpacity }} className="absolute bottom-0 left-0 right-0 px-4 md:px-8 py-6 md:py-8">
            <div className="max-w-7xl">
              {/* Mobile: Compact badges */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4"
              >
                <Badge className="bg-white text-black font-bold text-xs md:text-sm">STUDIO</Badge>
                <Badge variant="outline" className="border-white/30 text-white text-xs md:text-sm">{projects.length} PROJECTS</Badge>
              </motion.div>

              <motion.h1
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-2 md:mb-4"
              >
                Project Studio
              </motion.h1>

              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-sm md:text-lg text-white/90 mb-4 md:mb-6 max-w-2xl"
              >
                Create, manage, and deploy your NFT collections with powerful tools
              </motion.p>

              {/* Desktop: Action buttons */}
              {!isMobile && (
                <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-4">
                  <Button className="bg-white/10 border border-white/20 text-white hover:bg-white/20 font-bold px-6 py-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Project
                  </Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-6 py-3">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Collection
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Sticky Header - Responsive */}
        <div className="sticky top-16 md:top-0 z-30 bg-black/95 backdrop-blur-lg border-b border-white/10">
          <div className="px-4 md:px-8 py-3 md:py-4">
            {/* Mobile: Simplified stats */}
            {isMobile ? (
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-white/60">Total</p>
                    <p className="text-lg font-bold text-white">{projects.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Active</p>
                    <p className="text-lg font-bold text-white">{activeProjects}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">NFTs</p>
                    <p className="text-lg font-bold text-white">{totalNFTs}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')} className="h-8 w-8">
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="h-8 w-8">
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              /* Desktop: Full stats and controls */
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-sm text-white/60">Total Projects</p>
                    <p className="text-2xl font-bold text-white">{projects.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Active</p>
                    <p className="text-2xl font-bold text-white">{activeProjects}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Collections</p>
                    <p className="text-2xl font-bold text-white">{totalCollections}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Total NFTs</p>
                    <p className="text-2xl font-bold text-white">{totalNFTs}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64 bg-black/40 border-white/20 text-white placeholder:text-white/60"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant={viewMode === 'grid' ? 'default' : 'ghost'} onClick={() => setViewMode('grid')} className="text-white">
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className="text-white">
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Filter tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 font-medium transition-all duration-200 border-b-2 whitespace-nowrap text-sm md:text-base ${
                    activeTab === tab.id
                      ? 'text-white border-[rgb(163,255,18)]'
                      : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge className="bg-white/10 text-white text-xs ml-2">{tab.count}</Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 py-6 md:py-8 min-h-screen max-w-full">
          <StudioMainContent currentView="projects">
            <StudioProjects mockProjects={projects} viewMode={viewMode} />
          </StudioMainContent>
        </div>
      </div>
      )}
    </motion.div>
  );
}

export default function StudioProjectsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(163,255,18)]"></div>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  );
}