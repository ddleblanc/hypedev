"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share2,
  Download,
  Upload,
  Star,
  Zap,
  Layers,
  Box,
  Palette,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  MoreHorizontal,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Calendar,
  Clock,
  Target,
  Award,
  Globe,
  Shield,
  Rocket,
  Image as ImageIcon,
  FileText,
  Wand2,
  MonitorSpeaker
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { MediaRenderer } from "@/components/MediaRenderer";
import { StudioNavigation } from "@/components/studio/studio-navigation";
import { StudioMainContent } from "@/components/studio/studio-main-content";
import { StudioSidebar } from "@/components/studio/studio-sidebar";
import { StudioDashboard, StudioProjects } from "@/components/studio/views";

// Interfaces based on existing types from app-sidebar.tsx
interface Project {
  id: string;
  name: string;
  description: string;
  genre?: string;
  concept?: string;
  banner?: string;
  collections: number;
  totalNFTs: number;
  status: 'active' | 'draft';
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  projectId: string;
  project?: {
    id: string;
    name: string;
  };
  address?: string;
  chainId: number;
  contractType?: string;
  maxSupply?: number;
  nftCount: number;
  royaltyPercentage: number;
  isDeployed: boolean;
  volume: number;
  holders: number;
  createdAt: string;
  deployedAt?: string;
}

interface NFT {
  id: string;
  tokenId?: string;
  name: string;
  description?: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  collectionId: string;
  collection?: Collection;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isMinted: boolean;
  owner?: string;
  price?: number;
  createdAt: string;
  mintedAt?: string;
}

type StudioView = 'dashboard' | 'projects' | 'collections' | 'nfts' | 'create' | 'analytics';
type CreateMode = 'project' | 'collection' | 'nft' | 'batch';
type ViewMode = 'grid' | 'list' | 'gallery';

interface StudioViewProps {
  setViewMode: (mode: "home" | "trade" | "p2p" | "marketplace" | "play" | "museum" | "studio") => void;
}

// Mock data - In production this would come from API/thirdweb
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Cyber Warriors',
    description: 'Elite warriors from the digital realm',
    genre: 'Gaming',
    concept: 'PvP Combat NFTs',
    banner: 'https://picsum.photos/800/400?random=1',
    collections: 3,
    totalNFTs: 250,
    status: 'active',
    createdAt: '2024-01-15'
  },
  {
    id: '2', 
    name: 'Neon Guardians',
    description: 'Protectors of the metaverse',
    genre: 'Sci-Fi',
    concept: 'Collectible Heroes',
    banner: 'https://picsum.photos/800/400?random=2',
    collections: 2,
    totalNFTs: 150,
    status: 'draft',
    createdAt: '2024-02-01'
  }
];

const mockCollections: Collection[] = [
  {
    id: '1',
    name: 'Warrior Genesis',
    symbol: 'CWGEN',
    description: 'The first generation of cyber warriors',
    image: 'https://picsum.photos/300/300?random=10',
    bannerImage: 'https://picsum.photos/600/200?random=11',
    projectId: '1',
    chainId: 1,
    nftCount: 100,
    royaltyPercentage: 5,
    isDeployed: true,
    volume: 15.5,
    holders: 87,
    createdAt: '2024-01-20',
    deployedAt: '2024-01-25'
  },
  {
    id: '2',
    name: 'Guardian Elites',
    symbol: 'NGELITE',
    description: 'Elite tier guardians with special abilities',
    image: 'https://picsum.photos/300/300?random=12',
    bannerImage: 'https://picsum.photos/600/200?random=13',
    projectId: '2',
    chainId: 1,
    nftCount: 50,
    royaltyPercentage: 7.5,
    isDeployed: false,
    volume: 0,
    holders: 0,
    createdAt: '2024-02-05'
  }
];

const mockNFTs: NFT[] = [
  {
    id: '1',
    tokenId: '1',
    name: 'Alpha Warrior #001',
    description: 'The first and most powerful cyber warrior',
    image: 'https://picsum.photos/400/400?random=20',
    attributes: [
      { trait_type: 'Strength', value: 95 },
      { trait_type: 'Speed', value: 88 },
      { trait_type: 'Weapon', value: 'Plasma Sword' },
      { trait_type: 'Armor', value: 'Quantum Shield' }
    ],
    collectionId: '1',
    rarity: 'legendary',
    isMinted: true,
    price: 2.5,
    createdAt: '2024-01-22',
    mintedAt: '2024-01-25'
  },
  {
    id: '2',
    tokenId: '2',
    name: 'Beta Guardian #002',
    description: 'A skilled guardian with defensive capabilities',
    image: 'https://picsum.photos/400/400?random=21',
    attributes: [
      { trait_type: 'Defense', value: 92 },
      { trait_type: 'Health', value: 90 },
      { trait_type: 'Shield', value: 'Energy Barrier' },
      { trait_type: 'Element', value: 'Lightning' }
    ],
    collectionId: '2',
    rarity: 'epic',
    isMinted: false,
    createdAt: '2024-02-08'
  }
];

export function StudioView({ setViewMode }: StudioViewProps) {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<StudioView>('dashboard');
  const [createMode, setCreateMode] = useState<CreateMode>('project');
  const [viewMode, setViewModeState] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  // Animation state for smooth transitions
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [currentView]);

  // Filter functions
  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCollections = mockCollections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !selectedProject || collection.projectId === selectedProject.id;
    return matchesSearch && matchesProject;
  });

  const filteredNFTs = mockNFTs.filter(nft => {
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection = !selectedCollection || nft.collectionId === selectedCollection.id;
    return matchesSearch && matchesCollection;
  });

  // Render the main navigation bar
  const renderNavigationBar = () => (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-20 bg-black/20 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8"
    >
      {/* Left - Back button and title */}
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMode('home')}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-black text-white">NFT STUDIO</h1>
            <p className="text-sm text-white/60">Create • Manage • Deploy</p>
          </div>
        </div>
      </div>

      {/* Center - Main navigation tabs */}
      <div className="flex items-center gap-2 bg-black/30 rounded-xl p-1">
        {([
          { key: 'dashboard', label: 'Dashboard', icon: MonitorSpeaker },
          { key: 'projects', label: 'Projects', icon: Box },
          { key: 'collections', label: 'Collections', icon: Layers },
          { key: 'nfts', label: 'NFTs', icon: Sparkles },
          { key: 'create', label: 'Create', icon: Plus },
          { key: 'analytics', label: 'Analytics', icon: TrendingUp }
        ] as const).map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={currentView === key ? "default" : "ghost"}
            size="sm"
            onClick={() => setCurrentView(key)}
            className={cn(
              "transition-all duration-200",
              currentView === key
                ? "bg-white text-black font-bold shadow-lg"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* Right - User and actions */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" className="border-white/20 text-white/70">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Crown className="h-4 w-4 text-white" />
        </div>
      </div>
    </motion.div>
  );

  // Render search and filter bar
  const renderSearchBar = () => (
    <div className="h-16 bg-black/10 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-8">
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search projects, collections, NFTs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-[rgb(163,255,18)]/50"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="border-white/20 text-white/70 hover:border-[rgb(163,255,18)]/50"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={viewMode === 'grid' ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewModeState('grid')}
          className="text-white/70 hover:text-white"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'list' ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewModeState('list')}
          className="text-white/70 hover:text-white"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === 'gallery' ? "default" : "ghost"}
          size="sm"
          onClick={() => setViewModeState('gallery')}
          className="text-white/70 hover:text-white"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Render dashboard overview
  const renderDashboard = () => (
    <div className="space-y-8 pb-8">
      {/* Welcome header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
      </motion.div>

      {/* Quick stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4"
      >
        {[
          { label: 'Total Projects', value: mockProjects.length, icon: Box, color: 'blue' },
          { label: 'Collections', value: mockCollections.length, icon: Layers, color: 'purple' },
          { label: 'NFTs Created', value: mockNFTs.length, icon: Sparkles, color: 'hypex' },
          { label: 'Total Volume', value: '18.2 ETH', icon: DollarSign, color: 'yellow' }
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:border-white/20 transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon className={cn(
                "h-6 w-6",
                color === 'blue' && "text-blue-400",
                color === 'purple' && "text-purple-400", 
                color === 'hypex' && "text-[rgb(163,255,18)]",
                color === 'yellow' && "text-yellow-400"
              )} />
              <div className="text-xl font-black text-white">{value}</div>
            </div>
            <div className="text-sm text-white/60">{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="text-xl font-bold text-white">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'Created new project', name: 'Cyber Warriors', time: '2 hours ago', icon: Box },
            { action: 'Deployed collection', name: 'Guardian Elites', time: '1 day ago', icon: Layers },
            { action: 'Minted NFT', name: 'Alpha Warrior #001', time: '2 days ago', icon: Sparkles },
          ].map(({ action, name, time, icon: Icon }) => (
            <div key={name} className="flex items-center gap-3 p-3 bg-black/10 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
              <Icon className="h-5 w-5 text-[rgb(163,255,18)]" />
              <div className="flex-1">
                <div className="text-sm text-white">{action}: <span className="font-semibold">{name}</span></div>
                <div className="text-xs text-white/50">{time}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h3 className="text-xl font-bold text-white">Quick Actions</h3>
        <div className="grid gap-4">
          {[
            {
              title: 'Create New Project',
              description: 'Start a new NFT project from scratch',
              icon: Box,
              action: () => setCurrentView('create'),
              color: 'from-blue-500/20 to-blue-600/20'
            },
            {
              title: 'Design Collection',
              description: 'Create and configure your NFT collection',
              icon: Layers,
              action: () => setCurrentView('create'),
              color: 'from-purple-500/20 to-purple-600/20'
            },
            {
              title: 'Mint NFTs',
              description: 'Generate and deploy your digital assets',
              icon: Sparkles,
              action: () => setCurrentView('create'),
              color: 'from-[rgb(163,255,18)]/20 to-[rgb(163,255,18)]/30'
            }
          ].map(({ title, description, icon: Icon, action, color }) => (
            <div
              key={title}
              onClick={action}
              className={cn(
                "bg-gradient-to-br p-6 rounded-xl border border-white/10 cursor-pointer transition-all duration-300 hover:border-white/20",
                color
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className="h-8 w-8 text-white" />
                <h3 className="text-lg font-bold text-white">{title}</h3>
              </div>
              <p className="text-white/60 text-sm mb-3">{description}</p>
              <div className="flex items-center text-white/80 text-sm">
                Get Started <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // Render projects view
  const renderProjects = () => (
    <div className="space-y-6 pb-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Projects</h2>
          <p className="text-white/60">Manage your NFT project portfolio</p>
        </div>
        <Button 
          onClick={() => setCurrentView('create')}
          className="bg-gradient-to-r from-[rgb(163,255,18)] to-[rgb(163,255,18)]/90 hover:from-[rgb(163,255,18)]/90 hover:to-[rgb(163,255,18)] text-black font-bold"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300"
          >
            {/* Project banner */}
            <div className="relative h-32 overflow-hidden">
              <MediaRenderer
                src={project.banner || ''}
                alt={project.name}
                className="w-full h-full transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-3 right-3">
                <Badge 
                  variant={project.status === 'active' ? 'default' : 'outline'}
                  className={cn(
                    "text-xs",
                    project.status === 'active' 
                      ? 'bg-[rgb(163,255,18)] text-black' 
                      : 'border-white/20 text-white/70'
                  )}
                >
                  {project.status.toUpperCase()}
                </Badge>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="text-xl font-black text-white mb-1">{project.name}</h3>
                <p className="text-white/80 text-sm line-clamp-1">{project.description}</p>
              </div>
            </div>

            {/* Project details */}
            <div className="p-4">
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-black text-white">{project.collections}</div>
                  <div className="text-xs text-white/60">Collections</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-white">{project.totalNFTs}</div>
                  <div className="text-xs text-white/60">NFTs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-white">{project.genre}</div>
                  <div className="text-xs text-white/60">Genre</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-[rgb(163,255,18)]">Active</div>
                  <div className="text-xs text-white/60">Status</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedProject(project);
                    setCurrentView('collections');
                  }}
                  className="flex-1 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Eye className="h-3 w-3 mr-2" />
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add project card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: filteredProjects.length * 0.05 + 0.1 }}
          onClick={() => setCurrentView('create')}
          className="group bg-black/10 backdrop-blur-sm rounded-xl border-2 border-dashed border-white/20 p-8 text-center cursor-pointer hover:border-[rgb(163,255,18)]/50 hover:bg-[rgb(163,255,18)]/5 transition-all duration-300"
        >
          <Plus className="h-12 w-12 text-white/40 mx-auto mb-4 group-hover:text-[rgb(163,255,18)] transition-colors" />
          <h3 className="text-lg font-bold text-white/70 mb-2 group-hover:text-white transition-colors">Create New Project</h3>
          <p className="text-white/50 text-sm group-hover:text-white/70 transition-colors">Start building your next NFT collection</p>
        </motion.div>
      </motion.div>
    </div>
  );

  // Main render function - integrate with existing design system
  return (
    <div className="h-full grid grid-cols-[1fr_2fr_1fr] gap-6">
      {/* Left Panel - Studio Navigation */}
      <StudioNavigation 
        currentView={currentView} 
        onViewChange={(view) => setCurrentView(view as StudioView)} 
      />

      {/* Center Panel - Main Content Area (Scrollable) */}
      <div className="relative overflow-y-auto max-h-full custom-scrollbar pr-4">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && renderDashboard()}
          {currentView === 'projects' && renderProjects()}
          {/* Add other views here */}
        </AnimatePresence>
      </div>

      {/* Right Panel - Context & Actions */}
      <motion.div 
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ 
          duration: 0.3, 
          ease: "easeOut", 
          delay: 0.25 
        }}
        className="flex flex-col h-full space-y-6"
      >
        {/* Search & Filters */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              onClick={() => setCurrentView('create')}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
            <Button 
              onClick={() => setCurrentView('create')}
              className="w-full justify-start"
              variant="outline"
            >
              <Layers className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
            <Button 
              onClick={() => setCurrentView('create')}
              className="w-full justify-start"
              variant="outline"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Mint NFT
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
