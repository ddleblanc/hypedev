"use client";

import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { 
  Menu,
  X,
  Crown,
  FolderOpen,
  Layers3,
  Sparkles,
  Plus,
  Home,
  ArrowLeft,
  Search,
  Settings,
  ChevronRight,
  Grid3X3,
  List,
  Filter,
  SortAsc,
  MoreVertical
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StudioContext = 'overview' | 'projects' | 'collections' | 'nfts' | 'create';
type ViewMode = 'grid' | 'list' | 'timeline';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft';
  collections: number;
  totalNFTs: number;
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  symbol: string;
  projectId: string;
  chainId: number;
  maxSupply?: number;
  nftCount: number;
  royaltyPercentage: number;
  isDeployed: boolean;
  volume: number;
  holders: number;
  createdAt: string;
}

interface MobileStudioNavProps {
  context: StudioContext;
  currentProject?: Project | null;
  currentCollection?: Collection | null;
  projects?: Project[];
  collections?: Collection[];
  
  // Search & View
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  
  // Navigation
  onNavigate?: {
    goHome: () => void;
    goToProjects: () => void;
    goToProject: (project: Project) => void;
    goToCollection: (collection: Collection) => void;
    createProject: () => void;
    createCollection: () => void;
    createNFT: () => void;
  };
  onBack?: () => void;
  
  // Actions
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
  };
  
  // Title & Breadcrumbs
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; onClick?: () => void; icon?: React.ComponentType<{ className?: string }> }>;
}

const contextConfig = {
  overview: { icon: Crown, color: "text-yellow-400", bgColor: "bg-yellow-400/20" },
  projects: { icon: FolderOpen, color: "text-blue-400", bgColor: "bg-blue-400/20" },
  collections: { icon: Layers3, color: "text-purple-400", bgColor: "bg-purple-400/20" },
  nfts: { icon: Sparkles, color: "text-green-400", bgColor: "bg-green-400/20" },
  create: { icon: Plus, color: "text-pink-400", bgColor: "bg-pink-400/20" },
};

export function MobileStudioNav({
  context,
  currentProject,
  currentCollection,
  projects = [],
  collections = [],
  searchQuery = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  viewMode = "grid",
  onViewModeChange,
  onNavigate,
  onBack,
  primaryAction,
  title,
  subtitle,
  breadcrumbs = []
}: MobileStudioNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  const config = contextConfig[context];
  const ContextIcon = config.icon;

  // Build smart navigation items
  const navigationItems = React.useMemo(() => {
    const items = [
      {
        label: "Dashboard",
        icon: Crown,
        onClick: onNavigate?.goHome,
        isActive: context === 'overview',
        badge: null,
      },
      {
        label: "Projects",
        icon: FolderOpen,
        onClick: onNavigate?.goToProjects,
        isActive: context === 'projects',
        badge: projects.length > 0 ? String(projects.length) : null,
      },
    ];

    if (currentProject) {
      items.push({
        label: "Collections",
        icon: Layers3,
        onClick: () => currentProject && onNavigate?.goToProject(currentProject),
        isActive: context === 'collections',
        badge: collections.length > 0 ? String(collections.length) : null,
      });
    }

    if (currentCollection) {
      items.push({
        label: "NFTs", 
        icon: Sparkles,
        onClick: () => currentCollection && onNavigate?.goToCollection(currentCollection),
        isActive: context === 'nfts',
        badge: currentCollection.nftCount > 0 ? String(currentCollection.nftCount) : null,
      });
    }

    return items;
  }, [context, currentProject, currentCollection, projects.length, collections.length, onNavigate]);

  return (
    <>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-gray-900/95 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left Section */}
          <div className="flex items-center gap-3">
            {/* Back Button */}
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-2 hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Menu Trigger */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-white/10"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="left" 
                className="w-80 p-0 bg-gray-900 border-r border-white/10"
              >
                <MobileNavContent
                  context={context}
                  currentProject={currentProject}
                  currentCollection={currentCollection}
                  projects={projects}
                  collections={collections}
                  navigationItems={navigationItems}
                  onNavigate={onNavigate}
                  onClose={() => setIsOpen(false)}
                />
              </SheetContent>
            </Sheet>

            {/* Context & Title */}
            <div className="flex items-center gap-2 min-w-0">
              <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                <ContextIcon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="min-w-0">
                {title && (
                  <h1 className="text-sm font-semibold text-white truncate">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-xs text-gray-400 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Search Toggle */}
            {onSearchChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                className={`p-2 hover:bg-white/10 ${isSearchExpanded ? 'text-blue-400' : 'text-gray-400'}`}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {/* View Mode Toggle */}
            {onViewModeChange && (
              <div className="flex border border-white/10 rounded-lg p-0.5 bg-white/5">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onViewModeChange("grid")}
                  className="h-7 w-7 p-0"
                >
                  <Grid3X3 className="h-3 w-3" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onViewModeChange("list")}
                  className="h-7 w-7 p-0"
                >
                  <List className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Primary Action */}
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                size="sm"
                className="gap-2 bg-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/90 text-black font-medium h-8 px-3"
              >
                {primaryAction.icon && <primaryAction.icon className="h-4 w-4" />}
                <span className="hidden xs:inline">{primaryAction.label}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Search */}
        <AnimatePresence>
          {isSearchExpanded && onSearchChange && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10 overflow-hidden"
            >
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Quick Actions Bar */}
      <div className="sticky top-16 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-white/10 lg:hidden">
        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
          {/* Quick Navigation Pills */}
          {breadcrumbs.map((crumb, index) => (
            <button
              key={index}
              onClick={crumb.onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-sm text-gray-300 hover:text-white transition-colors whitespace-nowrap"
            >
              {crumb.icon && <crumb.icon className="h-3 w-3" />}
              <span>{crumb.label}</span>
            </button>
          ))}
          
          {breadcrumbs.length > 0 && (
            <div className="w-px h-6 bg-white/10 mx-2" />
          )}

          {/* Context Actions */}
          <div className="flex items-center gap-2">
            {context === 'projects' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigate?.createProject}
                className="gap-2 text-blue-400 hover:bg-blue-400/10"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Project</span>
              </Button>
            )}
            
            {context === 'collections' && currentProject && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigate?.createCollection}
                className="gap-2 text-purple-400 hover:bg-purple-400/10"
              >
                <Plus className="h-4 w-4" />
                <span className="text-xs">Collection</span>
              </Button>
            )}
            
            {context === 'nfts' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigate?.createNFT}
                className="gap-2 text-green-400 hover:bg-green-400/10"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-xs">NFT</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Mobile Navigation Content
function MobileNavContent({
  context,
  currentProject,
  currentCollection,
  projects,
  collections,
  navigationItems,
  onNavigate,
  onClose
}: {
  context: StudioContext;
  currentProject?: Project | null;
  currentCollection?: Collection | null;
  projects: Project[];
  collections: Collection[];
  navigationItems: Array<{
    label: string;
    icon: React.ForwardRefExoticComponent<Omit<React.SVGProps<SVGSVGElement>, "ref"> & React.RefAttributes<SVGSVGElement>>;
    onClick?: () => void;
    isActive?: boolean;
    badge?: string | null;
  }>;
  onNavigate?: {
    goToProject?: (project: Project) => void;
    goToCollection?: (collection: Collection) => void;
  };
  onClose: () => void;
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-white">Studio</div>
            <div className="text-xs text-gray-400">Creative Dashboard</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-2 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Main Navigation */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </h3>
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.onClick?.();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    item.isActive
                      ? 'text-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10 border-l-2 border-[rgb(163,255,18)]'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Section */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Projects
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedSection(expandedSection === 'projects' ? null : 'projects')}
                  className="p-1 hover:bg-white/10"
                >
                  <ChevronRight className={`h-3 w-3 transition-transform ${
                    expandedSection === 'projects' ? 'rotate-90' : ''
                  }`} />
                </Button>
              </div>
              
              <AnimatePresence>
                {expandedSection === 'projects' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-1 overflow-hidden"
                  >
                    {projects.slice(0, 5).map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          onNavigate?.goToProject?.(project);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          currentProject?.id === project.id
                            ? 'text-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <FolderOpen className="h-3 w-3" />
                        <span className="flex-1 text-left truncate">{project.name}</span>
                        <div className="flex items-center gap-1">
                          {project.status === 'active' && (
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          )}
                          <span className="text-xs text-gray-500">{project.collections}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Collections Section */}
          {collections.length > 0 && currentProject && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Collections
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedSection(expandedSection === 'collections' ? null : 'collections')}
                  className="p-1 hover:bg-white/10"
                >
                  <ChevronRight className={`h-3 w-3 transition-transform ${
                    expandedSection === 'collections' ? 'rotate-90' : ''
                  }`} />
                </Button>
              </div>
              
              <AnimatePresence>
                {expandedSection === 'collections' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-1 overflow-hidden"
                  >
                    {collections.slice(0, 5).map((collection) => (
                      <button
                        key={collection.id}
                        onClick={() => {
                          onNavigate?.goToCollection?.(collection);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          currentCollection?.id === collection.id
                            ? 'text-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Layers3 className="h-3 w-3" />
                        <span className="flex-1 text-left truncate">{collection.name}</span>
                        <div className="flex items-center gap-1">
                          {collection.isDeployed && (
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                          )}
                          <span className="text-xs text-gray-500">{collection.nftCount}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 border-white/10 text-gray-300 hover:bg-white/5"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}
