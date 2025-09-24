"use client";

import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles,
  Star,
  PlayCircle,
  Lock,
  Gem,
  Heart,
  CheckCircle,
  Clock,
  Smartphone,
  Code,
  Cpu,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/MediaRenderer";
import { type Legend, museumProgress } from "./legend-data";

interface MuseumGallerySectionProps {
  legends: Legend[];
  onSelectLegend: (id: string) => void;
}

export const MuseumGallery = forwardRef<HTMLDivElement, MuseumGallerySectionProps>(
  ({ legends, onSelectLegend }, ref) => {
    
    return (
      <section ref={ref} className="px-16 py-32 bg-gradient-to-b from-black via-gray-900/10 to-black relative overflow-hidden">
        {/* Background Elements - Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full bg-[linear-gradient(rgba(163,255,18,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(163,255,18,0.1)_1px,transparent_1px)] bg-[size:100px_100px]" />
        </div>
        
        
        {/* Section Header with Advanced Typography */}
        <div className="text-center mb-24 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "linear" }}
          >
            <Badge className="mb-8 bg-white/5 text-white/60 border-white/10 text-sm font-light px-6 py-2">
              Tech Legends Collection
            </Badge>
            
            <motion.h2 
              className="text-5xl font-light text-white mb-8 leading-none tracking-wide"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "linear" }}
            >
              Hall of Legends
            </motion.h2>
            
            <motion.p 
              className="text-xl text-white/60 max-w-4xl mx-auto leading-relaxed mb-16 font-light"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "linear" }}
            >
              Discover the pioneers who shaped our digital world. Each legend represents a 
              revolutionary breakthrough that transformed technology forever. Collect their stories,
              unlock their secrets, and preserve their legacy for future generations.
            </motion.p>
            
            {/* Advanced Progress Stats with Animations */}
            <motion.div 
              className="flex justify-center gap-12 mb-16"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              {[
                { 
                  label: "Legends Unlocked", 
                  value: `${museumProgress.unlockedLegends}/${museumProgress.totalLegends}`,
                  percentage: (museumProgress.unlockedLegends / museumProgress.totalLegends) * 100
                },
                { 
                  label: "Collection Complete", 
                  value: `${Math.round((museumProgress.unlockedLegends / museumProgress.totalLegends) * 100)}%`,
                  percentage: (museumProgress.unlockedLegends / museumProgress.totalLegends) * 100
                },
                { 
                  label: "Curator Level", 
                  value: museumProgress.explorationLevel.toString(),
                  percentage: (museumProgress.explorationLevel / 10) * 100
                }
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="text-center relative"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, type: "spring", stiffness: 200 }}
                >
                  {/* Circular Progress Background */}
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <svg className="w-24 h-24 rotate-[-90deg]" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="rgb(163,255,18)"
                        strokeWidth="8"
                        fill="transparent"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: stat.percentage / 100 }}
                        transition={{ duration: 2, delay: 1 + index * 0.2, ease: "easeInOut" }}
                        style={{
                          pathLength: stat.percentage / 100,
                          strokeDasharray: "251.2 251.2"
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black text-[rgb(163,255,18)]">
                        {typeof stat.value === 'string' && stat.value.includes('/') 
                          ? stat.value.split('/')[0] 
                          : stat.value}
                      </span>
                    </div>
                  </div>
                  <p className="text-white/60 font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
        
        {/* Enhanced Legends Grid - Premium Card Design */}
        <div className="grid grid-cols-2 gap-16 max-w-8xl mx-auto mb-24">
          {legends.map((legend, index) => (
            <motion.div
              key={legend.id}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.3, duration: 1 }}
              whileHover={{ 
                scale: 1.02, 
                y: -10,
                rotateY: 2
              }}
              className="group cursor-pointer relative"
              onClick={() => onSelectLegend(legend.id)}
              data-interactive="true"
            >
              <Card className="bg-gradient-to-br from-gray-900/60 to-black/80 backdrop-blur-2xl border border-white/10 hover:border-white/30 transition-all duration-700 overflow-hidden h-full relative">
                {/* Background Image with Advanced Parallax */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-all duration-700">
                  <MediaRenderer
                    src={legend.bannerImage}
                    alt={legend.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    aspectRatio="auto"
                  />
                </div>
                
                {/* Premium Card Glow Effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at center, ${legend.color}10, transparent 70%)`
                  }}
                />
                
                {/* Header Section with Video Preview */}
                <div className="relative h-96 overflow-hidden">
                  <MediaRenderer
                    src={legend.bannerImage}
                    alt={legend.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    aspectRatio="auto"
                  />
                  
                  {/* Premium Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
                  
                  {/* Video Play Hint on Hover */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                    initial={{ scale: 0.8 }}
                    whileHover={{ scale: 1 }}
                  >
                    <div className="bg-black/60 backdrop-blur-xl rounded-full p-6 border border-white/20">
                      <PlayCircle className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>
                  
                  {/* Legend Portrait and Info - Enhanced */}
                  <div className="absolute bottom-8 left-8 flex items-end gap-8">
                    <motion.div 
                      className="relative group/portrait"
                      whileHover={{ scale: 1.1, rotateZ: 2 }}
                    >
                      <div 
                        className="w-28 h-32 rounded-2xl overflow-hidden border-3 shadow-lg relative"
                        style={{ borderColor: legend.color }}
                      >
                        <MediaRenderer
                          src={legend.portrait}
                          alt={legend.name}
                          className="w-full h-full object-cover"
                          aspectRatio="auto"
                        />
                        
                        {/* Portrait Hover Glow */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover/portrait:opacity-30 transition-all duration-300"
                          style={{ backgroundColor: legend.color }}
                        />
                      </div>
                      
                      {/* Floating Rarity Indicator with Animation */}
                      <motion.div
                        className="absolute -top-2 -right-2"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Badge 
                          className="font-bold text-xs px-2 py-1"
                          style={{ 
                            backgroundColor: legend.rarity === "Mythic" ? "#ff6b6b" : "#ffd93d",
                            color: "black"
                          }}
                        >
                          {legend.rarity}
                        </Badge>
                      </motion.div>
                    </motion.div>
                    
                    <div className="flex-1">
                      <Badge 
                        className="mb-3 text-sm font-bold px-3 py-1"
                        style={{ 
                          backgroundColor: `${legend.color}20`, 
                          color: legend.color, 
                          borderColor: `${legend.color}40` 
                        }}
                      >
                        {legend.category}
                      </Badge>
                      
                      <h3 className="text-3xl font-black text-white mb-2 leading-tight">
                        {legend.name}
                      </h3>
                      
                      <p className="text-xl font-bold mb-4" style={{ color: legend.color }}>
                        {legend.title}
                      </p>
                      
                      {/* Enhanced Progress System */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-white/60">Discovery Progress</span>
                            <span className="text-white font-bold">{legend.completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="h-2 rounded-full relative"
                              style={{ backgroundColor: legend.color }}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${legend.completionPercentage}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                            >
                              {/* Animated shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            </motion.div>
                          </div>
                        </div>
                        <Badge className="bg-white/10 text-white border-white/20 font-bold">
                          Lv.{legend.discoveryLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Impact Badge with Advanced Styling */}
                  <motion.div
                    className="absolute top-8 right-8"
                    whileHover={{ scale: 1.1 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Badge 
                      className="font-bold text-sm px-4 py-2 backdrop-blur-sm"
                      style={{ 
                        backgroundColor: legend.impact === "Revolutionary" ? "#ff6b6b20" : "#4ecdc420",
                        color: legend.impact === "Revolutionary" ? "#ff6b6b" : "#4ecdc4",
                        borderColor: legend.impact === "Revolutionary" ? "#ff6b6b40" : "#4ecdc440"
                      }}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      {legend.impact}
                    </Badge>
                  </motion.div>
                  
                  {/* Lock Overlay for Locked Legends */}
                  {!legend.unlocked && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <motion.div 
                        className="text-center"
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <Lock className="w-16 h-16 text-white/40 mx-auto mb-4" />
                        <p className="text-white/60 font-bold text-lg">Complete Previous Legends</p>
                      </motion.div>
                    </div>
                  )}
                </div>
                
                {/* Enhanced Card Content */}
                <CardContent className="p-8 relative">
                  <p className="text-white/80 text-lg leading-relaxed mb-8">
                    {legend.tagline}
                  </p>
                  
                  {/* Premium Stats Grid with Hover Effects */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    {Object.entries(legend.stats).slice(0, 3).map(([key, value]) => (
                      <motion.div 
                        key={key} 
                        className="text-center group/stat cursor-pointer"
                        whileHover={{ scale: 1.05, y: -2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 group-hover/stat:border-white/20 transition-all duration-300 relative overflow-hidden">
                          {/* Stat hover glow */}
                          <div 
                            className="absolute inset-0 opacity-0 group-hover/stat:opacity-20 transition-all duration-300"
                            style={{ backgroundColor: legend.color }}
                          />
                          <p className="text-white/60 text-xs font-medium mb-1 capitalize relative z-10">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <p className="text-white font-bold text-lg relative z-10">{value}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Interactive Elements Preview with Gamification */}
                  <div className="mb-8">
                    <p className="text-white/60 text-sm font-medium mb-3">Interactive Elements</p>
                    <div className="flex gap-2">
                      {legend.interactiveElements.slice(0, 3).map((element, i) => (
                        <motion.div
                          key={element.id}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all cursor-pointer relative",
                            element.unlocked 
                              ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                              : "bg-gray-500/20 text-gray-400"
                          )}
                          whileHover={{ scale: element.unlocked ? 1.1 : 1 }}
                          whileTap={{ scale: element.unlocked ? 0.95 : 1 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          {element.unlocked ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10">
                            <div className="bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md whitespace-nowrap">
                              {element.name}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Advanced Action Buttons */}
                  <div className="flex items-center gap-4">
                    <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        className="w-full font-bold text-lg py-6 transition-all duration-300 relative overflow-hidden group"
                        style={{ backgroundColor: `${legend.color}20`, color: legend.color }}
                        disabled={!legend.unlocked}
                        data-interactive="true"
                      >
                        {/* Button glow effect */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-300"
                          style={{ backgroundColor: legend.color }}
                        />
                        <div className="relative flex items-center justify-center">
                          {legend.unlocked ? (
                            <>
                              <PlayCircle className="w-5 h-5 mr-2" />
                              Enter Hall
                            </>
                          ) : (
                            <>
                              <Lock className="w-5 h-5 mr-2" />
                              Locked
                            </>
                          )}
                        </div>
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10 px-4 py-6"
                        data-collectible="true"
                      >
                        <Gem className="w-5 h-5" />
                      </Button>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10 px-4 py-6"
                      >
                        <Heart className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
        
        {/* Coming Soon Section with Premium Gamification */}
        <motion.div 
          className="text-center"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <h3 className="text-4xl font-black text-white mb-12">Coming to the Hall</h3>
          
          <div className="grid grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
            {[
              { name: "Steve Jobs", category: "Design Revolution", icon: Smartphone, color: "#ff6b6b" },
              { name: "Linus Torvalds", category: "Open Source Pioneer", icon: Code, color: "#4ecdc4" },
              { name: "Grace Hopper", category: "Programming Languages", icon: Cpu, color: "#ffd93d" },
              { name: "Tim Berners-Lee", category: "World Wide Web", icon: Monitor, color: "#a855f7" }
            ].map((legend, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Coming soon glow effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-all duration-500"
                  style={{ background: `radial-gradient(circle at center, ${legend.color}40, transparent 70%)` }}
                />
                
                <div 
                  className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative"
                  style={{ backgroundColor: `${legend.color}20` }}
                >
                  <legend.icon className="w-10 h-10" style={{ color: legend.color }} />
                </div>
                
                <h4 className="text-white font-bold text-xl mb-3 relative z-10">{legend.name}</h4>
                <p className="text-white/60 text-sm mb-4 relative z-10">{legend.category}</p>
                
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 font-bold relative z-10">
                  <Clock className="w-3 h-3 mr-1" />
                  Coming Soon
                </Badge>
              </motion.div>
            ))}
          </div>
          
          {/* Premium Newsletter Signup */}
          <motion.div 
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-white/10 max-w-4xl mx-auto relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[rgb(163,255,18)]/5 via-transparent to-[rgb(163,255,18)]/5" />
            
            <h4 className="text-2xl font-bold text-white mb-4 relative z-10">Be the First to Know</h4>
            <p className="text-white/70 mb-8 relative z-10">Get notified when new legends join the Hall</p>
            
            <div className="flex gap-4 max-w-md mx-auto relative z-10">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[rgb(163,255,18)] transition-all duration-300"
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="bg-[rgb(163,255,18)] text-black font-bold px-8 hover:bg-[rgb(163,255,18)]/90 transition-all duration-300">
                  Notify Me
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>
    );
  }
);