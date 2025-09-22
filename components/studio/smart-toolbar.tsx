"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft,
  Home,
  Crown,
  FolderOpen,
  Layers3,
  Plus,
  Search,
  Grid3X3,
  List,
  Settings,
  Filter,
  SortAsc,
  Download,
  Upload,
  Share2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Zap,
  Sparkles,
  MoreHorizontal,
  RefreshCw,
  Save,
  Undo,
  Redo,
  Play,
  Pause,
  Archive,
  Trash2,
  Copy,
  ExternalLink,
  ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type StudioContext = 'overview' | 'projects' | 'collections' | 'nfts' | 'create';
type ViewMode = 'grid' | 'list' | 'timeline';

interface SmartToolbarProps {
  context: StudioContext;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; onClick?: () => void; icon?: React.ComponentType<{ className?: string }> }>;
  
  // Search functionality
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  
  // View controls
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewToggle?: boolean;
  
  // Actions
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
    loading?: boolean;
  };
  secondaryActions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    shortcut?: string;
  }>;
  
  // Navigation
  onBack?: () => void;
  onHome?: () => void;
  
  // Selection state
  selectedCount?: number;
  totalCount?: number;
  
  // Context-specific props
  contextData?: {
    projects?: { active: number; draft: number };
    collections?: { deployed: number; draft: number };
    nfts?: { minted: number; pending: number };
  };
  
  // Filtering and sorting
  filterOptions?: Array<{ label: string; value: string; count?: number }>;
  sortOptions?: Array<{ label: string; value: string }>;
  activeFilters?: string[];
  activeSortBy?: string;
  onFilterChange?: (filters: string[]) => void;
  onSortChange?: (sortBy: string) => void;
}

const contextIcons = {
  overview: Crown,
  projects: FolderOpen,
  collections: Layers3,
  nfts: Sparkles,
  create: Plus,
};

const contextColors = {
  overview: "text-yellow-400 bg-yellow-400/20",
  projects: "text-blue-400 bg-blue-400/20", 
  collections: "text-purple-400 bg-purple-400/20",
  nfts: "text-green-400 bg-green-400/20",
  create: "text-pink-400 bg-pink-400/20",
};

export function SmartToolbar({
  context,
  title,
  subtitle,
  breadcrumbs = [],
  searchQuery = "",
  onSearchChange,
  searchPlaceholder,
  viewMode = "grid",
  onViewModeChange,
  showViewToggle = true,
  primaryAction,
  secondaryActions = [],
  onBack,
  onHome,
  selectedCount = 0,
  totalCount = 0,
  contextData,
  filterOptions = [],
  sortOptions = [],
  activeFilters = [],
  activeSortBy,
  onFilterChange,
  onSortChange,
}: SmartToolbarProps) {
  const [isSticky, setIsSticky] = React.useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // Sticky behavior
  React.useEffect(() => {
    const handleScroll = () => {
      if (toolbarRef.current) {
        const rect = toolbarRef.current.getBoundingClientRect();
        setIsSticky(rect.top <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const ContextIcon = contextIcons[context];
  const contextColorClass = contextColors[context];

  // Build smart breadcrumb with context awareness
  const smartBreadcrumbs = React.useMemo(() => {
    const items = [
      {
        label: "Studio",
        icon: Crown,
        onClick: onHome || (() => {})
      },
      ...breadcrumbs
    ];

    return items;
  }, [breadcrumbs, onHome]);

  // Context-specific quick stats
  const quickStats = React.useMemo(() => {
    const stats = [];
    
    if (contextData?.projects) {
      stats.push(
        { label: "Active", value: contextData.projects.active, color: "text-green-400" },
        { label: "Draft", value: contextData.projects.draft, color: "text-yellow-400" }
      );
    }
    
    if (contextData?.collections) {
      stats.push(
        { label: "Deployed", value: contextData.collections.deployed, color: "text-green-400" },
        { label: "Draft", value: contextData.collections.draft, color: "text-gray-400" }
      );
    }
    
    if (contextData?.nfts) {
      stats.push(
        { label: "Minted", value: contextData.nfts.minted, color: "text-green-400" },
        { label: "Pending", value: contextData.nfts.pending, color: "text-yellow-400" }
      );
    }
    
    return stats;
  }, [contextData]);

  return (
    <TooltipProvider>
      <motion.div
        ref={toolbarRef}
        className={`sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl transition-all duration-300 ${
          isSticky 
            ? 'bg-gray-900/95 shadow-lg' 
            : 'bg-gray-900/80'
        }`}
        layout
      >
        <div className="px-4 lg:px-6">
          {/* Main Toolbar */}
          <div className="flex items-center gap-4 py-4">
            {/* Left Section - Navigation & Context */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Back Button */}
              {onBack && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onBack}
                      className="flex-shrink-0 hover:bg-white/5"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Go back</TooltipContent>
                </Tooltip>
              )}

              {/* Context Icon & Title */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg ${contextColorClass}`}>
                  <ContextIcon className="h-5 w-5" />
                </div>
                
                <div className="min-w-0">
                  {title && (
                    <h1 className="text-lg font-semibold text-white truncate">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-gray-400 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Smart Breadcrumbs */}
              {smartBreadcrumbs.length > 1 && (
                <div className="hidden md:flex items-center gap-2 ml-4">
                  {smartBreadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && (
                        <span className="text-gray-600">/</span>
                      )}
                      <button
                        onClick={item.onClick}
                        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 transition-colors text-sm text-gray-400 hover:text-white"
                      >
                        {item.icon && <item.icon className="h-3 w-3" />}
                        <span>{item.label}</span>
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Quick Stats */}
              {quickStats.length > 0 && (
                <div className="hidden lg:flex items-center gap-4 ml-4">
                  {quickStats.map((stat, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{stat.label}</span>
                      <span className={`text-sm font-semibold ${stat.color}`}>
                        {stat.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Center Section - Search & Selection */}
            <div className="flex items-center gap-3">
              {/* Selection Counter */}
              <AnimatePresence>
                {selectedCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-lg border border-blue-500/30"
                  >
                    <span className="text-sm text-blue-400">
                      {selectedCount} selected
                    </span>
                    {totalCount > 0 && (
                      <span className="text-xs text-gray-500">
                        of {totalCount}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Smart Search */}
              {onSearchChange && (
                <div className={`relative transition-all duration-300 ${
                  isSearchExpanded ? 'w-80' : 'w-64'
                }`}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={searchPlaceholder || "Search..."}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={() => setIsSearchExpanded(true)}
                    onBlur={() => setIsSearchExpanded(false)}
                    className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-white/20 focus:bg-white/10"
                  />
                </div>
              )}
            </div>

            {/* Right Section - Actions & Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* View Toggle */}
              {showViewToggle && onViewModeChange && (
                <div className="flex border border-white/10 rounded-lg p-0.5 bg-white/5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onViewModeChange("grid")}
                        className="h-8 w-8 p-0"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Grid view</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onViewModeChange("list")}
                        className="h-8 w-8 p-0"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>List view</TooltipContent>
                  </Tooltip>
                </div>
              )}

              {/* Filters */}
              {filterOptions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      {activeFilters.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {activeFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {filterOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => {
                          const newFilters = activeFilters.includes(option.value)
                            ? activeFilters.filter(f => f !== option.value)
                            : [...activeFilters, option.value];
                          onFilterChange?.(newFilters);
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <div className="flex items-center gap-2">
                            {option.count !== undefined && (
                              <Badge variant="outline" className="text-xs">
                                {option.count}
                              </Badge>
                            )}
                            {activeFilters.includes(option.value) && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Sort */}
              {sortOptions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <SortAsc className="h-4 w-4" />
                      Sort
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {sortOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onSortChange?.(option.value)}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          {activeSortBy === option.value && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Secondary Actions */}
              {secondaryActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {secondaryActions.map((action, index) => (
                      <DropdownMenuItem key={index} onClick={action.onClick}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            {action.icon && <action.icon className="h-4 w-4" />}
                            <span>{action.label}</span>
                          </div>
                          {action.shortcut && (
                            <Badge variant="outline" className="text-xs">
                              {action.shortcut}
                            </Badge>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Primary Action */}
              {primaryAction && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={primaryAction.onClick}
                      disabled={primaryAction.loading}
                      variant={primaryAction.variant || 'default'}
                      className="gap-2 bg-[rgb(163,255,18)] hover:bg-[rgb(163,255,18)]/90 text-black font-medium"
                    >
                      {primaryAction.loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        primaryAction.icon && <primaryAction.icon className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">{primaryAction.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{primaryAction.label}</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Additional Context Bar - shows active filters, etc */}
          <AnimatePresence>
            {(activeFilters.length > 0 || selectedCount > 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-white/10 py-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {activeFilters.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Filters:</span>
                        {activeFilters.map((filter) => {
                          const option = filterOptions.find(o => o.value === filter);
                          return option ? (
                            <Badge 
                              key={filter} 
                              variant="secondary" 
                              className="text-xs cursor-pointer hover:bg-red-500/20"
                              onClick={() => {
                                const newFilters = activeFilters.filter(f => f !== filter);
                                onFilterChange?.(newFilters);
                              }}
                            >
                              {option.label} ×
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {(activeFilters.length > 0 || selectedCount > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onFilterChange?.([]);
                        // Clear selections if callback exists
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
