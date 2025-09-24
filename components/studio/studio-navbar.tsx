"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Box,
  Layers,
  Sparkles,
  Plus,
  Settings,
  BarChart3,
  MonitorSpeaker,
  RefreshCw,
  Activity,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioNavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function StudioNavbar({ currentView, onViewChange }: StudioNavbarProps) {
  const navigationItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: MonitorSpeaker
    },
    { 
      id: 'projects', 
      label: 'Projects', 
      icon: Box
    },
    { 
      id: 'collections', 
      label: 'Collections', 
      icon: Layers
    },
    { 
      id: 'nfts', 
      label: 'NFTs', 
      icon: Sparkles
    },
    { 
      id: 'activity', 
      label: 'Activity', 
      icon: Activity
    },
    { 
      id: 'create', 
      label: 'Create', 
      icon: Plus
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings
    }
  ];

  // Dynamic action buttons based on current view
  const getContextualActions = () => {
    switch (currentView) {
      case 'projects':
        return [
          { 
            id: 'new-project', 
            label: 'New Project', 
            icon: Plus,
            action: () => console.log('New Project'),
            primary: true
          }
        ];
      case 'collections':
        return [
          { 
            id: 'new-collection', 
            label: 'New Collection', 
            icon: Plus,
            action: () => console.log('New Collection'),
            primary: true
          }
        ];
      case 'nfts':
        return [
          { 
            id: 'create-nft', 
            label: 'Create NFT', 
            icon: Plus,
            action: () => console.log('Create NFT'),
            primary: true
          }
        ];
      case 'create':
        return [
          { 
            id: 'new-project', 
            label: 'New Project', 
            icon: Box,
            action: () => console.log('New Project'),
            primary: false
          },
          { 
            id: 'new-collection', 
            label: 'New Collection', 
            icon: Layers,
            action: () => console.log('New Collection'),
            primary: false
          },
          { 
            id: 'create-nft', 
            label: 'Create NFT', 
            icon: Sparkles,
            action: () => console.log('Create NFT'),
            primary: false
          }
        ];
      case 'analytics':
        return [
          { 
            id: 'export-data', 
            label: 'Export', 
            icon: Download,
            action: () => console.log('Export Data'),
            primary: false
          },
          { 
            id: 'refresh', 
            label: 'Refresh', 
            icon: RefreshCw,
            action: () => console.log('Refresh'),
            primary: false
          }
        ];
      default:
        return [];
    }
  };

  const contextualActions = getContextualActions();

  return (
    <div className="relative w-full">
      {/* Background blur effect */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm border-b border-white/10" />
      
      {/* Navigation container */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3">
        {/* Left side - Navigation items */}
        <div className="flex items-center gap-2">
          {navigationItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ y: -2 }}
              transition={{ 
                y: { duration: 0.15, ease: "easeOut" },
                opacity: { duration: 0.3, ease: "easeOut", delay: index * 0.03 }
              }}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300",
                currentView === item.id 
                  ? "bg-[rgb(163,255,18)] text-black shadow-lg shadow-[rgb(163,255,18)]/20" 
                  : "bg-white/5 text-white/70 hover:bg-[rgb(163,255,18)]/10 hover:text-[rgb(163,255,18)] hover:border-[rgb(163,255,18)]/20 border border-transparent"
              )}
            >
              {/* Icon */}
              <item.icon className={cn(
                "h-5 w-5 transition-transform duration-300",
                currentView === item.id ? "scale-110" : "group-hover:scale-110"
              )} />
              
              {/* Label */}
              <span className={cn(
                "text-sm font-semibold tracking-wide",
                currentView === item.id ? "text-black" : ""
              )}>
                {item.label}
              </span>

              {/* Active indicator */}
              {currentView === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[rgb(163,255,18)] rounded-xl -z-10"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Right side - Contextual action buttons */}
        <div className="flex items-center gap-2">
          {contextualActions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ 
                y: { duration: 0.15, ease: "easeOut" },
                opacity: { duration: 0.3, ease: "easeOut", delay: 0.2 + index * 0.03 }
              }}
              onClick={action.action}
              className={cn(
                "group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 font-semibold",
                action.primary
                  ? "bg-gradient-to-r from-[rgb(163,255,18)] to-green-400 hover:from-green-400 hover:to-[rgb(163,255,18)] text-black shadow-lg shadow-[rgb(163,255,18)]/20"
                  : "bg-white/5 text-white/70 hover:bg-[rgb(163,255,18)]/20 hover:text-[rgb(163,255,18)] border border-white/10 hover:border-[rgb(163,255,18)]/30"
              )}
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}