"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArchiveX, 
  Command, 
  File, 
  Inbox, 
  Send, 
  Trash2,
  Crown,
  Home,
  FolderOpen,
  Layers3,
  Plus,
  Search,
  Settings,
  ChevronDown,
  ChevronRight,
  Zap,
  Box,
  Upload,
  Activity,
  BarChart3,
  Palette,
  Users,
  Globe,
  Tag,
  Image as ImageIcon,
  FileText,
  Sparkles,
  TrendingUp,
  Eye,
  Calendar,
  Database,
  Rocket,
  Shield,
  Clock,
  ArrowLeft
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type StudioContext = 'overview' | 'projects' | 'collections' | 'nfts' | 'create'

interface Project {
  id: string
  name: string
  description: string
  genre?: string
  concept?: string
  banner?: string
  collections: number
  totalNFTs: number
  status: 'active' | 'draft'
  createdAt: string
}

interface Collection {
  id: string
  name: string
  symbol: string
  description?: string
  image?: string
  bannerImage?: string
  projectId: string
  project?: {
    id: string
    name: string
  }
  address?: string
  chainId: number
  contractType?: string
  maxSupply?: number
  nftCount: number
  royaltyPercentage: number
  isDeployed: boolean
  volume: number
  holders: number
  createdAt: string
  deployedAt?: string
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  // Studio-specific props
  context?: StudioContext
  currentProject?: Project | null
  currentCollection?: Collection | null
  projects?: Project[]
  collections?: Collection[]
  onNavigate?: {
    goHome: () => void
    goToProjects: () => void
    goToProject: (project: Project) => void
    goToCollections: () => void
    goToCollection: (collection: Collection) => void
    goToNFTs: () => void
    createProject: () => void
    createCollection: () => void
    createNFT: () => void
  }
}

// Studio navigation data
const getStudioNavigation = (context: StudioContext) => {
  const baseItems = [
    {
      title: "Overview",
      url: "/studio",
      icon: Home,
      isActive: context === 'overview',
      id: 'overview'
    },
    {
      title: "Projects",
      url: "/studio?view=projects",
      icon: FolderOpen,
      isActive: context === 'projects',
      id: 'projects'
    },
    {
      title: "Collections",
      url: "/studio?view=collections",
      icon: Layers3,
      isActive: context === 'collections',
      id: 'collections'
    },
    {
      title: "NFTs",
      url: "/studio?view=nfts",
      icon: Sparkles,
      isActive: context === 'nfts',
      id: 'nfts'
    },
    {
      title: "Create",
      url: "/studio?view=create",
      icon: Plus,
      isActive: context === 'create',
      id: 'create'
    },
  ]
  
  return baseItems
}

// Default data for non-studio contexts
const defaultData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
      isActive: true,
    },
    {
      title: "Drafts",
      url: "#",
      icon: File,
      isActive: false,
    },
    {
      title: "Sent",
      url: "#",
      icon: Send,
      isActive: false,
    },
    {
      title: "Junk",
      url: "#",
      icon: ArchiveX,
      isActive: false,
    },
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
      isActive: false,
    },
  ],
}

export function AppSidebar({ 
  context, 
  currentProject, 
  currentCollection, 
  projects = [], 
  collections = [], 
  onNavigate,
  ...props 
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { setOpen } = useSidebar()
  
  // Determine if we're in studio context
  const isStudioContext = pathname?.startsWith('/studio') || context !== undefined
  
  // Get appropriate navigation items
  const studioNav = context ? getStudioNavigation(context) : getStudioNavigation('overview')
  const [activeItem, setActiveItem] = React.useState(isStudioContext ? studioNav[0] : defaultData.navMain[0])

  // Handle navigation for studio context
  const handleStudioNavigation = (item: any) => {
    setActiveItem(item)
    if (onNavigate) {
      switch (item.id) {
        case 'overview':
          onNavigate.goHome()
          break
        case 'projects':
          onNavigate.goToProjects()
          break
        case 'collections':
          onNavigate.goToCollections()
          break
        case 'nfts':
          onNavigate.goToNFTs()
          break
        case 'create':
          // No specific action needed, create options will appear in second panel
          break
      }
    }
    setOpen(true)
  }

  const handleDefaultNavigation = (item: any) => {
    setActiveItem(item)
    setOpen(true)
  }

  // Get current navigation data
  const navItems = isStudioContext ? studioNav : defaultData.navMain
  const handleNavigation = isStudioContext ? handleStudioNavigation : handleDefaultNavigation

  // Render studio-specific content for second panel
  const renderStudioContent = () => {
    switch (activeItem?.id || context) {
      case 'projects':
        return (
          <div className="space-y-1">
            {projects.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No projects yet. Create your first project to get started.
              </div>
            ) : (
              projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
                  onClick={() => onNavigate?.goToProject(project)}
                >
                  <div className="flex w-full items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{project.name}</span>
                    {project.status && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {project.status}
                      </Badge>
                    )}
                  </div>
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {project.description}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {project.collections} collections • {project.totalNFTs} NFTs
                  </span>
                </motion.div>
              ))
            )}
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onNavigate?.createProject}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </div>
          </div>
        )

      case 'collections':
        return (
          <div className="space-y-1">
            {collections.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No collections yet. Create your first collection to get started.
              </div>
            ) : (
              collections.map((collection) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
                  onClick={() => onNavigate?.goToCollection(collection)}
                >
                  <div className="flex w-full items-center gap-2">
                    <Layers3 className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{collection.name}</span>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {collection.isDeployed ? 'Live' : 'Draft'}
                    </Badge>
                  </div>
                  <span className="line-clamp-2 text-xs text-muted-foreground">
                    {collection.description}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {collection.nftCount} NFTs • {collection.symbol}
                  </span>
                </motion.div>
              ))
            )}
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onNavigate?.createCollection}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Collection
              </Button>
            </div>
          </div>
        )

      case 'nfts':
        return (
          <div className="space-y-1">
            <div className="p-4 text-center text-sm text-muted-foreground">
              Your NFTs will appear here once you mint them.
            </div>
            <div className="p-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onNavigate?.createNFT}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New NFT
              </Button>
            </div>
          </div>
        )

      case 'create':
        return (
          <div className="space-y-1">
            <div className="p-4 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onNavigate?.createProject}
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Create Project
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onNavigate?.createCollection}
              >
                <Layers3 className="h-4 w-4 mr-2" />
                Create Collection
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onNavigate?.createNFT}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create NFT
              </Button>
            </div>
          </div>
        )

      default:
        return (
          <div className="p-4 space-y-4">
            <div className="text-center">
              <Crown className="h-12 w-12 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Creator Studio</h3>
              <p className="text-sm text-muted-foreground">
                Your creative workspace
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-2xl font-bold">{projects.length}</div>
                  <div className="text-xs text-muted-foreground">Projects</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="text-2xl font-bold">{collections.length}</div>
                  <div className="text-xs text-muted-foreground">Collections</div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onNavigate?.createProject}
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick Start: Create Project
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex h-screen bg-sidebar border-r border-sidebar-border overflow-hidden">
      {/* First sidebar - Navigation icons */}
      <div className="w-[calc(var(--sidebar-width-icon)_+_1px)] border-r border-sidebar-border bg-sidebar flex flex-col">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href={isStudioContext ? "/studio" : "/"}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {isStudioContext ? <Crown className="size-4" /> : <Command className="size-4" />}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {isStudioContext ? "Creator Studio" : "HypeX"}
                    </span>
                    <span className="truncate text-xs">
                      {isStudioContext ? "Creative Workspace" : "Enterprise"}
                    </span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => handleNavigation(item)}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={defaultData.user} />
        </SidebarFooter>
      </div>

      {/* Second sidebar - Dynamic content */}
      <div className="hidden flex-1 md:flex flex-col bg-sidebar">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              {activeItem?.title}
            </div>
            {isStudioContext && (
              <div className="flex items-center gap-2">
                {currentProject && (
                  <Badge variant="outline" className="text-xs">
                    {currentProject.name}
                  </Badge>
                )}
                {currentCollection && (
                  <Badge variant="outline" className="text-xs">
                    {currentCollection.name}
                  </Badge>
                )}
              </div>
            )}
          </div>
          <SidebarInput placeholder={isStudioContext ? "Search studio..." : "Type to search..."} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeItem?.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {isStudioContext ? renderStudioContent() : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Default content for {activeItem?.title}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </div>
  )
}
