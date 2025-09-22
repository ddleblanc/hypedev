"use client";

import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MediaRenderer } from "@/components/MediaRenderer";
import {
  Eye,
  Edit,
  Trash2
} from "lucide-react";

interface StudioProjectsProps {
  mockProjects: Array<{
    id: string;
    name: string;
    description?: string;
    banner?: string;
    status: string;
    collections: number;
    totalNFTs: number;
  }>;
  viewMode: 'grid' | 'list';
}

export function StudioProjects({ mockProjects, viewMode }: StudioProjectsProps) {
  return (
    <>

      {/* Projects Grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-6' : 'space-y-4'}>
        {mockProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.3,
              delay: index * 0.05,
              ease: "easeOut"
            }}
            className="group bg-black/30 rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300"
          >
            {/* Project Banner */}
            <div className="relative h-32 overflow-hidden">
              <MediaRenderer
                src={project.banner || ''}
                alt={project.name}
                className="w-full h-full transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-3 right-3">
                <Badge 
                  variant={project.status === 'active' ? 'default' : 'secondary'}
                  className={project.status === 'active' ? 'bg-[rgb(163,255,18)] text-black' : ''}
                >
                  {project.status}
                </Badge>
              </div>
            </div>

            {/* Project Info */}
            <div className="p-6">
              <h3 className="text-white text-lg font-bold mb-2">{project.name}</h3>
              <p className="text-white/60 text-sm mb-4 line-clamp-2">{project.description}</p>
              
              <div className="flex items-center justify-between text-sm text-white/50 mb-4">
                <span>{project.collections} Collections</span>
                <span>{project.totalNFTs} NFTs</span>
              </div>

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
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
