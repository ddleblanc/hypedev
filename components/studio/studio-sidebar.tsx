"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Box,
  Layers,
  Sparkles
} from "lucide-react";

interface StudioSidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  mockProjects: any[];
  mockCollections: any[];
  mockNFTs: any[];
}

export function StudioSidebar({ 
  searchQuery, 
  onSearchChange, 
  viewMode, 
  onViewModeChange,
  mockProjects,
  mockCollections,
  mockNFTs
}: StudioSidebarProps) {
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut", 
        delay: 0.25 
      }}
      className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-full flex flex-col opacity-0"
      style={{ opacity: 0 }}
    >
      {/* Search & Filters */}
      <div className="mb-6">
        <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search & Filter
        </h3>
        <div className="space-y-3">
          <Input
            placeholder="Search everything..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-black/30 border-white/20 text-white placeholder:text-white/40"
          />
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="flex-1"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "default" : "outline"}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="flex-1"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mb-6"></div>

      {/* Studio Stats */}
      <div className="mb-6">
        <h3 className="text-white text-lg font-bold mb-4">Studio Stats</h3>
        <div className="space-y-4">
          {[
            { label: 'Projects', value: mockProjects.length, icon: Box },
            { label: 'Collections', value: mockCollections.length, icon: Layers },
            { label: 'NFTs', value: mockNFTs.length, icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[rgb(163,255,18)]" />
                <span className="text-white/80 text-sm">{label}</span>
              </div>
              <Badge variant="secondary" className="bg-white/10 text-white">
                {value}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mb-6"></div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h3 className="text-white text-lg font-bold mb-4">Quick Actions</h3>
        <div className="space-y-2">
          <Button className="w-full bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black font-bold">
            Create Project
          </Button>
          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
            Import Collection
          </Button>
          <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
            Bulk Upload
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/10 mb-6"></div>

      {/* Resources & Help */}
      <div className="flex-1">
        <h3 className="text-white text-lg font-bold mb-4">Resources</h3>
        <div className="space-y-3">
          <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
            📚 Documentation
          </a>
          <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
            🎥 Video Tutorials
          </a>
          <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
            💡 Best Practices
          </a>
          <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
            🚀 API Reference
          </a>
          <a href="#" className="block text-white/60 hover:text-[rgb(163,255,18)] transition-colors text-sm">
            💬 Community Forum
          </a>
        </div>
      </div>
    </motion.div>
  );
}