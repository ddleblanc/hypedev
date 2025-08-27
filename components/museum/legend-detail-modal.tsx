"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Crown,
  PlayCircle,
  Gem,
  Share2,
  ChevronDown,
  Sparkles,
  Eye,
  Maximize2,
  Minimize2,
  VolumeX,
  Volume2,
  Play,
  Pause,
  Film,
  Clock,
  Trophy,
  Lock,
  Target,
  Zap,
  Rocket,
  ArrowRight,
  Star,
  CheckCircle,
  Circle,
  Heart,
  Quote,
  X,
  AlertCircle,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaRenderer } from "@/components/MediaRenderer";
import { type Legend } from "./legend-data";

interface LegendDetailModalProps {
  legend: Legend;
  onClose: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  immersiveMode: boolean;
  setImmersiveMode: (immersive: boolean) => void;
  mousePosition: { x: number; y: number };
}

type StoryStep = {
  title: string;
  content: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
};

export function LegendDetailModal({ 
  legend, 
  onClose, 
  isMuted, 
  setIsMuted,
  immersiveMode,
  setImmersiveMode,
  mousePosition 
}: LegendDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'story' | 'timeline' | 'artifacts' | 'achievements'>('story');
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryAutoplay, setIsStoryAutoplay] = useState(true);
  const [unlockedElements, setUnlockedElements] = useState<string[]>(['story']);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [viewedTimelineEvents, setViewedTimelineEvents] = useState<Set<number>>(new Set());
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState(0);
  const [masteryPoints, setMasteryPoints] = useState(0);
  const [unlockedArtifacts, setUnlockedArtifacts] = useState<Set<string>>(new Set());
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Auto-progress story sections with advanced timing
  useEffect(() => {
    if (!isStoryAutoplay || activeTab !== 'story') return;
    
    const timer = setTimeout(() => {
      setStoryProgress(prev => {
        const next = prev + 1;
        if (next >= 4) {
          setIsStoryAutoplay(false);
          // Unlock timeline after story completion
          setUnlockedElements(prev => [...prev, 'timeline']);
          return prev;
        }
        return next;
      });
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [storyProgress, isStoryAutoplay, activeTab]);
  
  const storySteps: StoryStep[] = [
    { title: "The Challenge", content: legend.story.challenge, icon: Target },
    { title: "The Breakthrough", content: legend.story.breakthrough, icon: Zap },
    { title: "The Legacy", content: legend.story.legacy, icon: Trophy },
    { title: "Modern Impact", content: legend.story.modernImpact, icon: Rocket }
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-black backdrop-blur-xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 overflow-y-auto">
        {/* Hero Section with Auto-Playing Video */}
        <div className="relative h-screen flex items-center overflow-hidden">
          <div className="absolute inset-0">
            {/* Premium Video Background */}
            <video
              ref={videoRef}
              autoPlay
              muted={isMuted}
              loop
              className="w-full h-full object-cover"
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            >
              <source src={legend.heroVideo} type="video/mp4" />
              <MediaRenderer
                src={legend.bannerImage}
                alt={legend.name}
                className="w-full h-full object-cover"
                aspectRatio="auto"
              />
            </video>
            
            {/* Premium Cinematic overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            
            {/* Interactive particles that respond to mouse */}
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `radial-gradient(2px 2px at ${mousePosition.x}% ${mousePosition.y}%, ${legend.color}80, transparent),
                                 radial-gradient(1px 1px at ${mousePosition.x + 20}% ${mousePosition.y + 30}%, ${legend.color}60, transparent),
                                 radial-gradient(3px 3px at ${mousePosition.x - 15}% ${mousePosition.y - 20}%, ${legend.color}40, transparent)`,
                backgroundSize: '150px 120px, 100px 80px, 200px 160px'
              }}
            />
          </div>
          
          {/* Advanced Controls */}
          <div className="absolute top-8 left-8 flex items-center gap-4 z-20">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/10 font-bold backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Hall
            </Button>
            
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl rounded-lg px-4 py-2">
              <Badge className="bg-white/10 text-white border-white/20">
                <Eye className="w-3 h-3 mr-1" />
                Immersive Mode
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImmersiveMode(!immersiveMode)}
                className="text-white hover:bg-white/10"
              >
                {immersiveMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="text-white hover:bg-white/10"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Hero Content with Enhanced Typography */}
          <div className="relative z-10 px-16 max-w-7xl mx-auto">
            <div className="flex items-start gap-16">
              {/* Portrait with Advanced Hover Effects */}
              <motion.div 
                className="flex-shrink-0"
                whileHover={{ scale: 1.05, rotate: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="w-96 h-[500px] rounded-3xl overflow-hidden relative group">
                  <MediaRenderer
                    src={legend.portrait}
                    alt={legend.name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    aspectRatio="auto"
                  />
                  
                  {/* Interactive glow effect */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                    style={{ 
                      boxShadow: `inset 0 0 100px ${legend.color}40, 0 0 100px ${legend.color}20`
                    }}
                  />
                  
                  {/* Rarity indicator */}
                  <Badge 
                    className="absolute top-6 right-6 font-bold text-sm px-3 py-1"
                    style={{ 
                      backgroundColor: legend.rarity === "Mythic" ? "#ff6b6b" : "#ffd93d",
                      color: "black"
                    }}
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    {legend.rarity}
                  </Badge>
                  
                  {/* Interactive overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-center">
                      <Sparkles className="w-12 h-12 text-white mx-auto mb-2" />
                      <p className="text-white font-bold">Discover Legend</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Legend Info with Advanced Animations */}
              <div className="flex-1 pt-12 space-y-8">
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  <Badge 
                    className="mb-6 text-sm font-bold px-6 py-3 backdrop-blur-sm"
                    style={{ 
                      backgroundColor: `${legend.color}20`, 
                      color: legend.color, 
                      borderColor: `${legend.color}40` 
                    }}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {legend.category} • {legend.impact} • {legend.era}
                  </Badge>
                  
                  <h1 className="text-8xl font-black text-white mb-6 leading-none tracking-tight">
                    {legend.name}
                  </h1>
                  
                  <p className="text-4xl font-bold mb-8" style={{ color: legend.color }}>
                    {legend.title}
                  </p>
                  
                  <p className="text-2xl text-white/90 mb-12 max-w-4xl leading-relaxed">
                    {legend.story.heroLine}
                  </p>
                </motion.div>
                
                {/* Enhanced Stats Grid */}
                <motion.div 
                  className="grid grid-cols-3 gap-8 mb-12"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  {Object.entries(legend.stats).slice(0, 3).map(([key, value], index) => (
                    <div key={key} className="text-center group">
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                        <p className="text-white/60 text-sm font-medium mb-2 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <motion.p 
                          className="text-3xl font-black text-white"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.7 + index * 0.1, type: "spring", stiffness: 200 }}
                        >
                          {value}
                        </motion.p>
                      </div>
                    </div>
                  ))}
                </motion.div>
                
                {/* Action Buttons with Enhanced Styling */}
                <motion.div 
                  className="flex items-center gap-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                >
                  <Button 
                    size="lg"
                    className="font-bold px-12 py-4 text-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                    style={{ backgroundColor: legend.color, color: "black" }}
                    data-interactive="true"
                  >
                    <PlayCircle className="w-6 h-6 mr-3" />
                    Begin Discovery
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 font-bold px-8 py-4 backdrop-blur-sm"
                    data-collectible="true"
                  >
                    <Gem className="w-5 h-5 mr-2" />
                    Collect NFT
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="border-white/30 text-white hover:bg-white/10 font-bold px-8 py-4 backdrop-blur-sm"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator with Animation */}
          <motion.div 
            className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-center"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <p className="text-white/60 text-sm mb-3">Discover the Journey</p>
            <ChevronDown className="w-8 h-8 text-white/60 mx-auto" />
          </motion.div>
        </div>
        
        {/* Interactive Storytelling Section */}
        <div className="px-16 py-20 bg-gradient-to-b from-black via-gray-900/10 to-black">
          {/* Navigation Tabs */}
          <div className="flex justify-center mb-16">
            <div className="flex bg-black/40 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
              {(['story', 'timeline', 'artifacts', 'achievements'] as const).map((tab) => {
                // Check if all quiz questions have been answered correctly
                const allQuizzes = legend.timeline.filter(t => t.quiz);
                const correctAnswers = Object.entries(quizAnswers).filter(([index, answer]) => {
                  const timelineIndex = parseInt(index);
                  const timelineQuiz = legend.timeline[timelineIndex]?.quiz;
                  return timelineQuiz && answer === timelineQuiz.correctAnswer;
                }).length;
                const allQuestionsAnswered = correctAnswers === allQuizzes.length && allQuizzes.length > 0;
                
                // Artifacts tab unlocks when all questions are answered
                const isUnlocked = unlockedElements.includes(tab) || 
                                 (tab === 'artifacts' && allQuestionsAnswered);
                const IconComponent = tab === 'story' ? Film : 
                                    tab === 'timeline' ? Clock : 
                                    tab === 'artifacts' ? Gem : Trophy;
                
                return (
                  <button
                    key={tab}
                    onClick={() => isUnlocked && setActiveTab(tab)}
                    disabled={!isUnlocked}
                    className={cn(
                      "flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300",
                      activeTab === tab
                        ? "text-black"
                        : isUnlocked 
                        ? "text-white hover:bg-white/10" 
                        : "text-white/30 cursor-not-allowed"
                    )}
                    style={{
                      backgroundColor: activeTab === tab ? legend.color : 'transparent'
                    }}
                  >
                    {isUnlocked ? <IconComponent className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {!isUnlocked && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs ml-2">
                        Locked
                      </Badge>
                    )}
                    {tab === 'artifacts' && allQuestionsAnswered && activeTab !== 'artifacts' && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/40 text-xs ml-2 animate-pulse">
                        Unlocked!
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Story Mode - Netflix-style Progressive Disclosure */}
          {activeTab === 'story' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-4xl font-black text-white">The Legend's Journey</h2>
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setIsStoryAutoplay(!isStoryAutoplay)}
                      className={cn(
                        "font-bold",
                        isStoryAutoplay ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                      )}
                    >
                      {isStoryAutoplay ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {isStoryAutoplay ? 'Pause' : 'Resume'} Auto-play
                    </Button>
                    
                    <div className="text-white/60 text-sm">
                      Step {storyProgress + 1} of {storySteps.length}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-2 mb-8">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: legend.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${((storyProgress + 1) / storySteps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={storyProgress}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.8 }}
                  className="grid grid-cols-2 gap-16 items-center"
                >
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${legend.color}20` }}
                      >
                        {React.createElement(storySteps[storyProgress].icon, {
                          className: "w-8 h-8",
                          style: { color: legend.color }
                        })}
                      </div>
                      <h3 className="text-3xl font-bold text-white">
                        {storySteps[storyProgress].title}
                      </h3>
                    </div>
                    <p className="text-xl text-white/80 leading-relaxed mb-8">
                      {storySteps[storyProgress].content}
                    </p>
                    
                    <div className="flex gap-4">
                      <Button
                        onClick={() => setStoryProgress(Math.max(0, storyProgress - 1))}
                        disabled={storyProgress === 0}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={() => setStoryProgress(Math.min(storySteps.length - 1, storyProgress + 1))}
                        disabled={storyProgress === storySteps.length - 1}
                        style={{ backgroundColor: legend.color, color: "black" }}
                        className="font-bold"
                      >
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                      <MediaRenderer
                        src={legend.artifactImages[storyProgress]}
                        alt={storySteps[storyProgress].title}
                        className="w-full h-full object-cover"
                        aspectRatio="auto"
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
          
          {/* Interactive Timeline */}
          {activeTab === 'timeline' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-white mb-4">Timeline of Innovation</h2>
                <p className="text-white/60 text-lg mb-6">
                  Click on glowing events to answer knowledge questions • Correct answers unlock the next event
                </p>
                <div className="inline-flex items-center gap-4 bg-white/5 rounded-full px-6 py-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white/80">
                    Questions Answered: {Object.values(quizAnswers).filter((answer, i) => 
                      legend.timeline[i]?.quiz && answer === legend.timeline[i].quiz?.correctAnswer
                    ).length} / {legend.timeline.filter(t => t.quiz).length}
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-white/20 to-transparent transform -translate-x-1/2" />
                
                <div className="space-y-16">
                  {legend.timeline.map((event, index) => {
                    const isAvailable = index <= timelineProgress;
                    const hasAnswered = quizAnswers[index] !== undefined;
                    const answeredCorrectly = event.quiz && quizAnswers[index] === event.quiz.correctAnswer;
                    const canClick = isAvailable && (!hasAnswered || !answeredCorrectly);
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2, duration: 0.8 }}
                        className={cn(
                          "relative flex items-center",
                          index % 2 === 0 ? "justify-end pr-8" : "justify-start pl-8"
                        )}
                      >
                        {/* Timeline Node */}
                        <div 
                          className="absolute left-1/2 w-6 h-6 rounded-full border-4 transform -translate-x-1/2 z-10 transition-all duration-300"
                          style={{ 
                            backgroundColor: answeredCorrectly ? legend.color : 
                                           canClick ? `${legend.color}60` : 
                                           hasAnswered ? '#ef4444' : '#6b7280',
                            borderColor: answeredCorrectly ? legend.color :
                                       canClick ? legend.color :
                                       hasAnswered ? '#ef4444' : '#6b7280'
                          }}
                        />
                        
                        {/* Content Card */}
                        <div 
                          onClick={() => {
                            // Can click if it's available and either not answered or answered incorrectly
                            if (index <= timelineProgress && (quizAnswers[index] === undefined || !answeredCorrectly)) {
                              setCurrentQuizIndex(index);
                              setShowQuiz(true);
                            }
                          }}
                          className={cn(
                            "w-5/12 bg-white/5 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300",
                            canClick ? "border-yellow-500/50 hover:border-yellow-500/70 cursor-pointer" :
                            answeredCorrectly ? "border-green-500/30" :
                            hasAnswered && !answeredCorrectly ? "border-orange-500/50 hover:border-orange-500/70 cursor-pointer" :
                            "border-white/5 opacity-50 cursor-not-allowed"
                          )}
                        >
                        <div className="flex items-center gap-4 mb-4">
                          <Badge 
                            className="font-bold text-lg px-4 py-2"
                            style={{ 
                              backgroundColor: answeredCorrectly ? `${legend.color}20` : 
                                             canClick && !hasAnswered ? 'rgba(234,179,8,0.2)' :
                                             hasAnswered && !answeredCorrectly ? 'rgba(249,115,22,0.2)' : 'rgba(128,128,128,0.2)',
                              color: answeredCorrectly ? legend.color : 
                                     canClick && !hasAnswered ? 'rgb(234,179,8)' :
                                     hasAnswered && !answeredCorrectly ? 'rgb(249,115,22)' : 'gray'
                            }}
                          >
                            {event.year}
                          </Badge>
                          {!isAvailable && <Lock className="w-5 h-5 text-gray-400" />}
                          {canClick && !hasAnswered && <Sparkles className="w-5 h-5 text-yellow-500" />}
                          {hasAnswered && !answeredCorrectly && <ArrowRight className="w-5 h-5 text-orange-500" />}
                          {answeredCorrectly && <CheckCircle className="w-5 h-5 text-green-400" />}
                        </div>
                        
                        <h3 className={cn(
                          "text-xl font-bold mb-4",
                          isAvailable ? "text-white" : "text-white/50"
                        )}>{event.event}</h3>
                        
                        <p className={cn(
                          "leading-relaxed mb-6",
                          isAvailable ? "text-white/70" : "text-white/40"
                        )}>{isAvailable ? event.detail : "Answer the previous question to unlock this story..."}</p>
                        
                        {isAvailable && (
                          <div className="aspect-video rounded-lg overflow-hidden">
                            <MediaRenderer
                              src={event.media}
                              alt={event.event}
                              className="w-full h-full object-cover"
                              aspectRatio="auto"
                            />
                          </div>
                        )}
                        
                        {canClick && !hasAnswered && (
                          <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                            <p className="text-yellow-500 text-sm font-medium flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Click to answer the knowledge question
                            </p>
                          </div>
                        )}
                        
                        {hasAnswered && !answeredCorrectly && (
                          <div className="mt-4 p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                            <p className="text-orange-500 text-sm font-medium flex items-center gap-2">
                              <ArrowRight className="w-4 h-4" />
                              Try again - click to retry the question
                            </p>
                          </div>
                        )}
                        
                        {answeredCorrectly && (
                          <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                            <p className="text-green-400 text-sm font-medium flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Mastered! You've proven your understanding
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )})}
                </div>
              </div>
              
              {/* Knowledge Verification Quiz Modal */}
              <AnimatePresence>
                {showQuiz && legend.timeline[currentQuizIndex]?.quiz && (
                  <motion.div
                    className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                      if (e.target === e.currentTarget && quizAnswers[currentQuizIndex] !== undefined) {
                        setShowQuiz(false);
                      }
                    }}
                  >
                    <motion.div
                      className="max-w-4xl w-full bg-gradient-to-br from-gray-900 to-black rounded-3xl p-12 border border-white/10"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{ type: "tween", duration: 0.3 }}
                    >
                      {(() => {
                        const quiz = legend.timeline[currentQuizIndex].quiz!;
                        const hasAnswered = quizAnswers[currentQuizIndex] !== undefined;
                        const isCorrect = quizAnswers[currentQuizIndex] === quiz.correctAnswer;
                        
                        return (
                          <>
                            {/* Quiz Header */}
                            <div className="mb-8">
                              <div className="flex items-center justify-between mb-4">
                                <Badge className="text-sm px-3 py-1" style={{ 
                                  backgroundColor: `${legend.color}20`,
                                  color: legend.color
                                }}>
                                  {legend.timeline[currentQuizIndex].year} • {quiz.type === 'multiple' ? 'Multiple Choice' : 
                                   quiz.type === 'truefalse' ? 'True or False' : 
                                   quiz.type === 'connection' ? 'Make the Connection' : 'Timeline Order'}
                                </Badge>
                                <div className="flex items-center gap-4">
                                  <span className="text-white/60 text-sm">
                                    Difficulty: {quiz.difficulty}
                                  </span>
                                  <Badge className="bg-yellow-500/20 text-yellow-500">
                                    {quiz.points} points
                                  </Badge>
                                </div>
                              </div>
                              
                              <h3 className="text-3xl font-light text-white mb-2">
                                Knowledge Verification
                              </h3>
                              <p className="text-white/60">
                                Prove your understanding to unlock the next piece of history
                              </p>
                            </div>
                            
                            {/* Question */}
                            <div className="mb-8">
                              <h4 className="text-2xl text-white mb-4 leading-relaxed">
                                {quiz.question}
                              </h4>
                              
                              {quiz.hint && !hasAnswered && (
                                <div className="flex items-start gap-3 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 mb-6">
                                  <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                                  <p className="text-blue-400 text-sm">
                                    Hint: {quiz.hint}
                                  </p>
                                </div>
                              )}
                              
                              {/* Answer Options */}
                              <div className="space-y-4">
                                {quiz.options.map((option, optionIndex) => {
                                  const isSelected = quizAnswers[currentQuizIndex] === optionIndex;
                                  const isThisCorrect = optionIndex === quiz.correctAnswer;
                                  
                                  return (
                                    <motion.button
                                      key={optionIndex}
                                      onClick={() => {
                                        if (!hasAnswered) {
                                          setQuizAnswers(prev => ({
                                            ...prev,
                                            [currentQuizIndex]: optionIndex
                                          }));
                                          
                                          // Award points if correct
                                          if (optionIndex === quiz.correctAnswer) {
                                            setQuizScore(prev => prev + quiz.points);
                                            setMasteryPoints(prev => prev + quiz.points);
                                            setViewedTimelineEvents(prev => new Set([...prev, currentQuizIndex]));
                                            
                                            // Unlock artifacts at certain mastery levels
                                            if (masteryPoints + quiz.points >= 200 && legend.artifacts[0]) {
                                              setUnlockedArtifacts(prev => new Set([...prev, legend.artifacts[0].id]));
                                            }
                                            if (masteryPoints + quiz.points >= 400 && legend.artifacts[1]) {
                                              setUnlockedArtifacts(prev => new Set([...prev, legend.artifacts[1].id]));
                                            }
                                            
                                            // Advance timeline if this was blocking progress
                                            if (currentQuizIndex === timelineProgress && currentQuizIndex < legend.timeline.length - 1) {
                                              setTimeout(() => {
                                                setTimelineProgress(currentQuizIndex + 1);
                                              }, 2000);
                                            }
                                            
                                            // Check if all questions are answered correctly
                                            const allQuizzes = legend.timeline.filter(t => t.quiz);
                                            const correctAnswers = Object.entries(quizAnswers).filter(([index, answer]) => {
                                              const timelineIndex = parseInt(index);
                                              const timelineQuiz = legend.timeline[timelineIndex]?.quiz;
                                              return timelineQuiz && answer === timelineQuiz.correctAnswer;
                                            }).length;
                                            
                                            // If this answer completes all quizzes, auto-switch to artifacts
                                            if (correctAnswers + 1 === allQuizzes.length) {
                                              setTimeout(() => {
                                                setShowQuiz(false);
                                                setTimeout(() => {
                                                  setActiveTab('artifacts');
                                                }, 500);
                                              }, 2500);
                                            }
                                          }
                                        }
                                      }}
                                      className={cn(
                                        "w-full text-left p-6 rounded-xl border-2 transition-all duration-300",
                                        !hasAnswered ? "border-white/10 hover:border-white/30 hover:bg-white/5" :
                                        isSelected && isCorrect ? "border-green-500 bg-green-500/10" :
                                        isSelected && !isCorrect ? "border-red-500 bg-red-500/10" :
                                        isThisCorrect ? "border-green-500/50 bg-green-500/5" :
                                        "border-white/5 opacity-50"
                                      )}
                                      disabled={hasAnswered}
                                      whileHover={!hasAnswered ? { scale: 1.02 } : {}}
                                      whileTap={!hasAnswered ? { scale: 0.98 } : {}}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className={cn(
                                          "text-lg",
                                          hasAnswered && isThisCorrect ? "text-green-400" :
                                          hasAnswered && isSelected && !isCorrect ? "text-red-400" :
                                          "text-white"
                                        )}>
                                          {option}
                                        </span>
                                        {hasAnswered && (
                                          <>
                                            {isThisCorrect && <CheckCircle className="w-6 h-6 text-green-400" />}
                                            {isSelected && !isCorrect && <X className="w-6 h-6 text-red-400" />}
                                          </>
                                        )}
                                      </div>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                            
                            {/* Result & Explanation */}
                            {hasAnswered && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                  "p-6 rounded-xl mb-6",
                                  isCorrect ? "bg-green-500/10 border border-green-500/30" :
                                  "bg-red-500/10 border border-red-500/30"
                                )}
                              >
                                <div className="flex items-start gap-4">
                                  {isCorrect ? (
                                    <CheckCircle className="w-8 h-8 text-green-400 mt-1" />
                                  ) : (
                                    <AlertCircle className="w-8 h-8 text-red-400 mt-1" />
                                  )}
                                  <div className="flex-1">
                                    <h5 className={cn(
                                      "text-xl font-medium mb-2",
                                      isCorrect ? "text-green-400" : "text-red-400"
                                    )}>
                                      {isCorrect ? "Excellent! You've mastered this knowledge." : "Not quite right, but you're learning!"}
                                    </h5>
                                    <p className="text-white/70 leading-relaxed">
                                      {quiz.explanation}
                                    </p>
                                    {isCorrect && quiz.relatedArtifact && (
                                      <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                                        <p className="text-yellow-500 text-sm flex items-center gap-2">
                                          <Gem className="w-4 h-4" />
                                          You've made progress toward unlocking: {quiz.relatedArtifact}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                            
                            {/* Actions */}
                            <div className="flex justify-between items-center">
                              <div className="text-white/60">
                                Progress: {Object.keys(quizAnswers).length} / {legend.timeline.filter(t => t.quiz).length} completed
                              </div>
                              <div className="flex gap-4">
                                {hasAnswered && !isCorrect && (
                                  <Button
                                    onClick={() => {
                                      // Clear the wrong answer so they can try again
                                      setQuizAnswers(prev => {
                                        const newAnswers = { ...prev };
                                        delete newAnswers[currentQuizIndex];
                                        return newAnswers;
                                      });
                                      // Don't close the modal, let them try again immediately
                                    }}
                                    className="px-8 py-3 font-medium bg-orange-500 hover:bg-orange-600 text-white"
                                  >
                                    Try Again
                                  </Button>
                                )}
                                <Button
                                  onClick={() => setShowQuiz(false)}
                                  className={cn(
                                    "px-8 py-3 font-medium",
                                    hasAnswered && isCorrect ? "bg-green-500 hover:bg-green-600 text-white" :
                                    hasAnswered && !isCorrect ? "bg-white/10 hover:bg-white/20 text-white" :
                                    "bg-white/5 hover:bg-white/10 text-white/50"
                                  )}
                                  disabled={!hasAnswered}
                                >
                                  {hasAnswered && isCorrect ? "Continue Journey" : 
                                   hasAnswered ? "Close" : "Answer to Continue"}
                                </Button>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
          
          {/* Artifact Collection */}
          {activeTab === 'artifacts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-6xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-white mb-4">Legendary Artifacts</h2>
                <p className="text-white/70 text-lg mb-6">
                  Master the timeline to unlock these legendary artifacts
                </p>
                <div className="inline-flex items-center gap-6 bg-white/5 rounded-full px-8 py-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-white/80">Mastery Points: {masteryPoints}</span>
                  </div>
                  <div className="w-px h-6 bg-white/20" />
                  <div className="flex items-center gap-2">
                    <Gem className="w-5 h-5 text-purple-400" />
                    <span className="text-white/80">Artifacts Unlocked: {unlockedArtifacts.size} / {legend.artifacts.length}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-8">
                {legend.artifacts.map((artifact, index) => (
                  <motion.div
                    key={artifact.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.8 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="group cursor-pointer"
                    data-collectible="true"
                  >
                    <Card className={cn(
                      "bg-gradient-to-br from-gray-900/80 to-black/60 backdrop-blur-xl border transition-all duration-500 overflow-hidden",
                      artifact.unlocked 
                        ? "border-white/20 hover:border-white/40" 
                        : "border-gray-600/20 opacity-60"
                    )}>
                      <div className="relative h-64 overflow-hidden">
                        <MediaRenderer
                          src={artifact.media}
                          alt={artifact.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          aspectRatio="auto"
                        />
                        
                        {/* Rarity Glow */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-all duration-500"
                          style={{
                            background: `radial-gradient(circle at center, ${
                              artifact.rarity === 'Mythic' ? '#ff6b6b' :
                              artifact.rarity === 'Legendary' ? '#ffd93d' : '#4ecdc4'
                            }40, transparent 70%)`
                          }}
                        />
                        
                        {/* Rarity Badge */}
                        <Badge 
                          className="absolute top-4 right-4 font-bold"
                          style={{ 
                            backgroundColor: artifact.rarity === "Mythic" ? "#ff6b6b" : 
                                           artifact.rarity === "Legendary" ? "#ffd93d" : "#4ecdc4",
                            color: "black"
                          }}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          {artifact.rarity}
                        </Badge>
                        
                        {/* Lock Overlay */}
                        {!artifact.unlocked && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center">
                              <Lock className="w-12 h-12 text-white/60 mx-auto mb-2" />
                              <p className="text-white/60 font-bold">Complete Story to Unlock</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-2">{artifact.name}</h3>
                            <p className="text-white/70 text-sm mb-3">{artifact.description}</p>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <Badge className="bg-white/10 text-white border-white/20">
                                {artifact.type}
                              </Badge>
                              <span className="text-white/60">{artifact.year}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Collection Progress */}
                        {artifact.unlocked && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-white/60">Collection Progress</span>
                              <span className="text-white font-bold">{artifact.collectionProgress}%</span>
                            </div>
                            <Progress 
                              value={artifact.collectionProgress} 
                              className="h-2 bg-white/10"
                            />
                          </div>
                        )}
                        
                        {/* Action Button */}
                        <Button 
                          className={cn(
                            "w-full font-bold transition-all duration-300",
                            artifact.unlocked 
                              ? "hover:scale-105" 
                              : "opacity-50 cursor-not-allowed"
                          )}
                          style={{ 
                            backgroundColor: artifact.unlocked ? legend.color : 'gray',
                            color: "black"
                          }}
                          disabled={!artifact.unlocked}
                        >
                          {artifact.unlocked ? (
                            <>
                              <Gem className="w-4 h-4 mr-2" />
                              Mint NFT
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Locked
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {/* Achievement System */}
          {activeTab === 'achievements' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-white mb-4">Historic Achievements</h2>
                <p className="text-white/70 text-lg">
                  Milestones that changed the world
                </p>
              </div>
              
              <div className="space-y-6">
                {legend.achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.8 }}
                    className={cn(
                      "bg-white/5 backdrop-blur-sm rounded-2xl p-8 border transition-all duration-300",
                      achievement.unlocked 
                        ? "border-white/10 hover:border-white/20" 
                        : "border-gray-600/10 opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-6">
                      <div 
                        className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center",
                          achievement.unlocked ? "bg-green-500/20" : "bg-gray-500/20"
                        )}
                      >
                        {achievement.unlocked ? (
                          <CheckCircle className="w-8 h-8 text-green-400" />
                        ) : (
                          <Circle className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-2xl font-bold text-white">{achievement.name}</h3>
                          <Badge className="bg-white/10 text-white border-white/20 font-bold">
                            {achievement.year}
                          </Badge>
                        </div>
                        <p className="text-white/70 text-lg">{achievement.description}</p>
                      </div>
                      
                      {achievement.unlocked && (
                        <Button
                          className="font-bold"
                          style={{ backgroundColor: legend.color, color: "black" }}
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Commemorate
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Floating Action Menu */}
      <div className="fixed bottom-8 right-8 z-20">
        <div className="flex flex-col gap-4">
          <Button
            className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white hover:bg-black/80 transition-all"
            onClick={onClose}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <Button
            className="w-14 h-14 rounded-full text-black font-bold hover:scale-110 transition-all"
            style={{ backgroundColor: legend.color }}
          >
            <Heart className="w-6 h-6" />
          </Button>
          
          <Button
            className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white hover:bg-black/80 transition-all"
          >
            <Share2 className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}