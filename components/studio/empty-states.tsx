"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  FolderOpen,
  Layers,
  Image,
  Activity,
  BarChart3,
  Settings2,
  Plus,
  Sparkles,
  Search,
  Package,
  Box,
} from "lucide-react";
import { useStudio } from "@/contexts/studio-context";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

function EmptyStateBase({
  title,
  description,
  icon,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Illustrated icon container */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative mb-6"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-[rgb(163,255,18)]/20 blur-3xl rounded-full scale-150" />

        {/* Icon container */}
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-[rgb(163,255,18)]/20 to-[rgb(163,255,18)]/5 border border-[rgb(163,255,18)]/20 flex items-center justify-center">
          <div className="text-[rgb(163,255,18)]">{icon}</div>
        </div>

        {/* Decorative sparkles */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.8, 1, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles className="w-5 h-5 text-[rgb(163,255,18)]/60" />
        </motion.div>

        <motion.div
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-1 -left-1"
        >
          <Sparkles className="w-4 h-4 text-[rgb(163,255,18)]/40" />
        </motion.div>
      </motion.div>

      {/* Text */}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 max-w-md mb-6">{description}</p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {action && (
          <Button
            onClick={action.onClick}
            className="gap-2 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="gap-2 border-white/20 text-white hover:bg-white/10"
          >
            {secondaryAction.label}
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}

// View-specific empty states
export function ProjectsEmptyState() {
  const { openModal } = useStudio();

  return (
    <EmptyStateBase
      icon={<FolderOpen className="w-10 h-10" />}
      title="No projects yet"
      description="Projects help you organize your collections. Create your first project to get started with your NFT journey."
      action={{
        label: "Create Project",
        onClick: () => openModal("createProject"),
      }}
    />
  );
}

export function CollectionsEmptyState() {
  const { openModal } = useStudio();

  return (
    <EmptyStateBase
      icon={<Layers className="w-10 h-10" />}
      title="No collections yet"
      description="Collections are the foundation of your NFT ecosystem. Deploy your first smart contract to start minting."
      action={{
        label: "Create Collection",
        onClick: () => openModal("createCollection"),
      }}
    />
  );
}

export function NFTsEmptyState() {
  const { openModal } = useStudio();

  return (
    <EmptyStateBase
      icon={<Image className="w-10 h-10" />}
      title="No NFTs yet"
      description="Create NFTs to add to your collections. You can lazy mint to save gas or mint directly."
      action={{
        label: "Create NFT",
        onClick: () => openModal("createNft"),
      }}
    />
  );
}

export function ActivityEmptyState() {
  return (
    <EmptyStateBase
      icon={<Activity className="w-10 h-10" />}
      title="No activity yet"
      description="Your studio activity will appear here. Deploy collections, mint NFTs, or update settings to see activity."
    />
  );
}

export function AnalyticsEmptyState() {
  const { openModal } = useStudio();

  return (
    <EmptyStateBase
      icon={<BarChart3 className="w-10 h-10" />}
      title="No analytics data"
      description="Analytics data will appear once your collections have activity. Deploy a collection and make some sales to see insights."
      action={{
        label: "Create Collection",
        onClick: () => openModal("createCollection"),
      }}
    />
  );
}

export function LootboxEmptyState() {
  return (
    <EmptyStateBase
      icon={<Box className="w-10 h-10" />}
      title="No lootboxes yet"
      description="Create lootboxes with VRF-powered randomness. Add NFT rewards and configure drop rates."
      action={{
        label: "Create Lootbox",
        onClick: () => {
          // Navigate to lootbox creation
          window.location.href = "/studio/lootbox/create";
        },
      }}
    />
  );
}

export function SearchEmptyState({ query }: { query: string }) {
  const { resetFilters } = useStudio();

  return (
    <EmptyStateBase
      icon={<Search className="w-10 h-10" />}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search term or clear your filters.`}
      action={{
        label: "Clear Filters",
        onClick: resetFilters,
      }}
    />
  );
}

// Filtered empty state (when filters applied but no results)
export function FilteredEmptyState({
  entityType,
}: {
  entityType: "projects" | "collections" | "nfts";
}) {
  const { resetFilters } = useStudio();

  const labels = {
    projects: "projects",
    collections: "collections",
    nfts: "NFTs",
  };

  const icons = {
    projects: <FolderOpen className="w-10 h-10" />,
    collections: <Layers className="w-10 h-10" />,
    nfts: <Image className="w-10 h-10" />,
  };

  return (
    <EmptyStateBase
      icon={icons[entityType]}
      title={`No ${labels[entityType]} match your filters`}
      description="Try adjusting your filters or search criteria to find what you're looking for."
      action={{
        label: "Clear Filters",
        onClick: resetFilters,
      }}
    />
  );
}

// Dashboard empty state (when no data at all)
export function DashboardEmptyState() {
  const { openModal } = useStudio();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Multi-icon illustration */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative mb-8"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-[rgb(163,255,18)]/10 blur-3xl rounded-full scale-150" />

        {/* Icons arranged in a pattern */}
        <div className="relative flex items-center gap-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            className="w-16 h-16 rounded-xl bg-gradient-to-br from-[rgb(163,255,18)]/20 to-[rgb(163,255,18)]/5 border border-[rgb(163,255,18)]/20 flex items-center justify-center"
          >
            <FolderOpen className="w-7 h-7 text-[rgb(163,255,18)]" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            className="w-20 h-20 rounded-xl bg-gradient-to-br from-[rgb(163,255,18)]/30 to-[rgb(163,255,18)]/10 border border-[rgb(163,255,18)]/30 flex items-center justify-center"
          >
            <Layers className="w-9 h-9 text-[rgb(163,255,18)]" />
          </motion.div>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            className="w-16 h-16 rounded-xl bg-gradient-to-br from-[rgb(163,255,18)]/20 to-[rgb(163,255,18)]/5 border border-[rgb(163,255,18)]/20 flex items-center justify-center"
          >
            <Image className="w-7 h-7 text-[rgb(163,255,18)]" />
          </motion.div>
        </div>

        {/* Sparkles */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.8, 1, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-4 right-4"
        >
          <Sparkles className="w-5 h-5 text-[rgb(163,255,18)]/60" />
        </motion.div>
      </motion.div>

      {/* Text */}
      <h3 className="text-2xl font-semibold text-white mb-3">
        Welcome to Your Studio
      </h3>
      <p className="text-white/60 max-w-lg mb-8">
        Your creative workspace for building NFT collections. Start by creating
        a project, then add collections and mint NFTs.
      </p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button
          onClick={() => openModal("createProject")}
          className="gap-2 bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </Button>
        <Button
          variant="outline"
          onClick={() => openModal("createCollection")}
          className="gap-2 border-white/20 text-white hover:bg-white/10"
        >
          <Layers className="w-4 h-4" />
          Deploy Collection
        </Button>
      </motion.div>

      {/* Quick tips */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl"
      >
        {[
          {
            icon: FolderOpen,
            title: "Projects",
            desc: "Organize your collections",
          },
          { icon: Layers, title: "Collections", desc: "Smart contracts on-chain" },
          { icon: Image, title: "NFTs", desc: "Lazy mint or direct mint" },
        ].map((item, i) => (
          <div
            key={i}
            className={cn(
              "p-4 rounded-xl border border-white/10 bg-white/5",
              "hover:border-[rgb(163,255,18)]/30 transition-colors"
            )}
          >
            <item.icon className="w-6 h-6 text-[rgb(163,255,18)] mb-2" />
            <h4 className="text-sm font-medium text-white">{item.title}</h4>
            <p className="text-xs text-white/50">{item.desc}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

// Error state
export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyStateBase
      icon={<Settings2 className="w-10 h-10" />}
      title="Something went wrong"
      description={message || "An error occurred while loading your data. Please try again."}
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}
