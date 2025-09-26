"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaRenderer } from "@/components/MediaRenderer";
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  Layers,
  Clock,
  TrendingUp,
  Star,
  ExternalLink
} from "lucide-react";

interface StudioProjectsProps {
  mockProjects: any[];
  viewMode: 'grid' | 'list';
}

// Mobile-specific project card
const MobileProjectCard = ({ project, index }: { project: any; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ 
      duration: 0.3,
      delay: index * 0.05,
      ease: "easeOut"
    }}
    className="group bg-black/30 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300"
  >
    {/* Project Banner - Smaller height on mobile */}
    <div className="relative h-24 overflow-hidden">
      <MediaRenderer
        src={project.banner || ''}
        alt={project.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Status Badge */}
      <div className="absolute top-2 left-2">
        <Badge 
          variant={project.status === 'active' ? 'default' : 'secondary'}
          className={`text-[10px] px-2 py-0.5 font-bold ${
            project.status === 'active' ? 'bg-[rgb(163,255,18)] text-black' : 'bg-gray-500/90 text-white'
          }`}
        >
          {project.status?.toUpperCase()}
        </Badge>
      </div>

      {/* Quick Action */}
      <div className="absolute top-2 right-2">
        <button className="bg-black/60 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-3 h-3 text-white" />
        </button>
      </div>

      {/* Floating Stats */}
      <div className="absolute bottom-2 right-2 flex gap-2">
        {project.featured && (
          <div className="bg-yellow-500/90 backdrop-blur rounded-full p-1">
            <Star className="w-3 h-3 text-black" fill="black" />
          </div>
        )}
        {project.trending && (
          <div className="bg-purple-500/90 backdrop-blur rounded-full p-1">
            <TrendingUp className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>

    {/* Project Info - Condensed for mobile */}
    <div className="p-4">
      <h3 className="text-white text-sm font-bold mb-1 truncate">{project.name}</h3>
      <p className="text-white/60 text-xs mb-3 line-clamp-1">{project.description}</p>
      
      <div className="flex items-center justify-between text-xs text-white/50 mb-3">
        <span className="flex items-center gap-1">
          <Layers className="w-3 h-3" />
          {project.collections}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {project.totalNFTs}
        </span>
      </div>

      {/* Mobile Actions - Always visible */}
      <div className="flex gap-1">
        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-white/20 text-white hover:bg-white/10">
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-white/20 text-white hover:bg-white/10">
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </div>
  </motion.div>
);

// Desktop project card
const DesktopProjectCard = ({ project, index, viewMode }: { project: any; index: number; viewMode: 'grid' | 'list' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ 
      duration: 0.3,
      delay: index * 0.05,
      ease: "easeOut"
    }}
    className={`group bg-black/30 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 ${
      viewMode === 'list' ? 'flex' : ''
    }`}
  >
    {/* Project Banner */}
    <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 h-32' : 'h-32'}`}>
      <MediaRenderer
        src={project.banner || ''}
        alt={project.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {viewMode === 'grid' && (
        <>
          <div className="absolute top-3 right-3">
            <Badge 
              variant={project.status === 'active' ? 'default' : 'secondary'}
              className={project.status === 'active' ? 'bg-[rgb(163,255,18)] text-black' : ''}
            >
              {project.status}
            </Badge>
          </div>
          
          {/* Hover overlay with stats */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{project.collections}</p>
              <p className="text-xs text-white/60">Collections</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[rgb(163,255,18)]">{project.totalNFTs}</p>
              <p className="text-xs text-white/60">NFTs</p>
            </div>
          </div>
        </>
      )}
    </div>

    {/* Project Info */}
    <div className={`p-6 ${viewMode === 'list' ? 'flex-1 flex items-center justify-between' : ''}`}>
      {viewMode === 'list' ? (
        // List view layout
        <>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-white text-lg font-bold">{project.name}</h3>
              <Badge 
                variant={project.status === 'active' ? 'default' : 'secondary'}
                className={project.status === 'active' ? 'bg-[rgb(163,255,18)] text-black' : ''}
              >
                {project.status}
              </Badge>
            </div>
            <p className="text-white/60 text-sm mb-3">{project.description}</p>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {project.collections} Collections
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {project.totalNFTs} NFTs
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Updated {project.lastUpdated || '2 days ago'}
              </span>
            </div>
          </div>
          
          {/* Actions for list view */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" className="border-red-400/20 text-red-400 hover:bg-red-400/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        // Grid view layout
        <>
          <h3 className="text-white text-lg font-bold mb-2">{project.name}</h3>
          <p className="text-white/60 text-sm mb-4 line-clamp-2">{project.description}</p>
          
          <div className="flex items-center justify-between text-sm text-white/50 mb-4">
            <span className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              {project.collections} Collections
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {project.totalNFTs} NFTs
            </span>
          </div>

          {/* Progress bar */}
          {project.completionRate && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">Completion</span>
                <span className="text-[rgb(163,255,18)]">{project.completionRate}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${project.completionRate}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button size="sm" variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" className="border-red-400/20 text-red-400 hover:bg-red-400/10">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  </motion.div>
);

export function StudioProjects({ mockProjects, viewMode }: StudioProjectsProps) {
  // Check if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Add enriched data to projects
  const enrichedProjects = mockProjects.map(p => ({
    ...p,
    completionRate: Math.floor(Math.random() * 100),
    lastUpdated: ['2 hours ago', '1 day ago', '3 days ago', '1 week ago'][Math.floor(Math.random() * 4)],
    featured: Math.random() > 0.7,
    trending: Math.random() > 0.8
  }));

  return (
    <>
      {/* Projects Grid/List */}
      <div className={
        isMobile 
          ? 'grid grid-cols-2 gap-3 px-4' 
          : viewMode === 'grid' 
            ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
      }>
        {enrichedProjects.map((project, index) => (
          isMobile ? (
            <MobileProjectCard key={project.id} project={project} index={index} />
          ) : (
            <DesktopProjectCard key={project.id} project={project} index={index} viewMode={viewMode} />
          )
        ))}
      </div>

      {/* Empty state */}
      {mockProjects.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Layers className="w-12 h-12 text-white/40" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-sm text-white/60 mb-6">Create your first project to get started</p>
          <Button className="bg-[rgb(163,255,18)] text-black hover:bg-[rgb(163,255,18)]/90">
            Create Project
          </Button>
        </motion.div>
      )}
    </>
  );
}