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
  isMobile: boolean;
}

export const MuseumGallery = forwardRef<HTMLDivElement, MuseumGallerySectionProps>(
  ({ legends, onSelectLegend, isMobile }, ref) => {
    
    return (
      <section ref={ref} className="px-4 md:px-16 py-16 md:py-20 bg-[#0a0a0a] relative overflow-hidden">

        {/* Clean Section Header */}
        <div className="mb-10 md:mb-12 relative z-10">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h2
              className="text-2xl md:text-3xl font-medium text-white mb-2 tracking-tight"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              More Legends
            </motion.h2>

            <motion.p
              className="text-sm md:text-base text-white/40 font-light"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              Explore pioneering innovators who shaped technology
            </motion.p>
          </motion.div>
        </div>
        
        {/* Enhanced Legends Grid - Premium Card Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-16 max-w-8xl mx-auto mb-12 md:mb-24">
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
              <Card className="bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all duration-500 overflow-hidden h-full relative">
                {/* Background Image - Subtle */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-all duration-500">
                  <MediaRenderer
                    src={legend.bannerImage}
                    alt={legend.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    aspectRatio="auto"
                  />
                </div>
                
                {/* Header Section with Video Preview */}
                <div className="relative h-64 md:h-96 overflow-hidden">
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
                  <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 flex items-end gap-3 md:gap-8">
                    <motion.div
                      className="relative group/portrait"
                      whileHover={{ scale: isMobile ? 1 : 1.1, rotateZ: isMobile ? 0 : 2 }}
                    >
                      <div className="w-20 h-24 md:w-28 md:h-32 rounded-lg overflow-hidden border border-white/10 shadow-lg relative">
                        <MediaRenderer
                          src={legend.portrait}
                          alt={legend.name}
                          className="w-full h-full object-cover"
                          aspectRatio="auto"
                        />

                        {/* Minimal overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    </motion.div>
                    
                    <div className="flex-1">
                      <span className="text-xs md:text-sm text-white/30 font-light uppercase tracking-wide mb-2 block">
                        {legend.category}
                      </span>

                      <h3 className="text-xl md:text-2xl lg:text-3xl font-medium text-white mb-1 md:mb-2 leading-tight">
                        {legend.name}
                      </h3>

                      <p className="text-sm md:text-base text-white/50 mb-2 md:mb-3 font-light">
                        {legend.title}
                      </p>
                    </div>
                  </div>
                  
                  
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
                
                {/* Clean Card Content */}
                <CardContent className="p-4 md:p-6 relative">
                  <p className="text-white/40 text-sm md:text-base leading-relaxed mb-4 md:mb-6 font-light">
                    {legend.tagline}
                  </p>

                  {/* Minimal Stats - Grayscale */}
                  <div className="flex gap-4 md:gap-8 mb-4 md:mb-6">
                    {Object.entries(legend.stats).slice(0, 3).map(([key, value]) => (
                      <div key={key} className="flex-1">
                        <p className="text-white/30 text-xs font-light mb-1 uppercase tracking-wide">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-white/70 font-medium text-sm md:text-base">{value}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Progress Indicator - Subtle */}
                  <div className="mb-6">
                    <div className="flex gap-1.5">
                      {legend.interactiveElements.slice(0, 3).map((element, i) => (
                        <div
                          key={element.id}
                          className={cn(
                            "h-[2px] flex-1 rounded-full transition-all",
                            element.unlocked ? "bg-white/30" : "bg-white/5"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Clean Action Button */}
                  <div className="flex items-center gap-3">
                    <Button
                      className="flex-1 font-medium text-sm py-2.5 transition-colors bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-0"
                      disabled={!legend.unlocked}
                      data-interactive="true"
                    >
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

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-white/50 hover:bg-white/5 hover:text-white/70 px-3 py-2.5"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
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