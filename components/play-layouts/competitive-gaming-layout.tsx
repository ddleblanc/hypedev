"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Play,
  Info,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  Star,
  Volume2,
  VolumeX,
  MoreHorizontal,
  ArrowUpRight,
  Sword,
  Trophy,
  Target,
  Flame,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Leaderboard } from "@/components/gaming/leaderboard";
import { TournamentBracket } from "@/components/gaming/tournament-bracket";
import { useActiveAccount } from "thirdweb/react";
import { trpc } from "@/lib/trpc/client";

interface Game {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  category: string;
  subcategory?: string;
}

interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  startTime: string | Date;
  entryFee: number;
  prizePool: number;
  maxPlayers: number;
  currentPlayers: number;
  format: string;
  status: string;
  game?: Game | null;
}

const mockCompetitiveGames = {
  hero: {
    id: "esports-legends",
    title: "eSports Champions",
    subtitle: "Rise to the top of competitive gaming",
    description: "Prove your skills in intense competitive battles. Join tournaments, climb rankings, and compete with the best players worldwide for massive prize pools and eternal glory.",
    image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
    logo: "/api/placeholder/200/80",
    items: 25000,
    floor: "4.2 ETH",
    volume: "25.8K ETH",
    creator: "ProGaming",
    rating: 4.8,
    isNew: false,
    tags: ["Competitive", "Esports", "High Stakes"]
  },
  featured: [
    {
      id: "fps-arena",
      title: "FPS Arena Championship",
      subtitle: "First-person shooter tournaments",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
      items: 15000,
      floor: "3.5 ETH",
      volume: "18.2K ETH",
      isNew: true,
      trending: "+47%",
      creator: "EliteGaming"
    },
    {
      id: "moba-legends",
      title: "MOBA Legends League",
      subtitle: "Strategic team-based combat",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
      items: 12000,
      floor: "2.8 ETH",
      volume: "14.7K ETH",
      isNew: false,
      trending: "+31%",
      creator: "StrategyPro"
    },
    {
      id: "battle-royale",
      title: "Battle Royale Masters",
      subtitle: "Last player standing wins all",
      image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/ea507b10-5017-472d-8433-06c0676dee51/transcode=true,original=true,quality=90/WanVideoWrapper_I2V_00047.webm",
      items: 20000,
      floor: "5.1 ETH",
      volume: "32.4K ETH",
      isNew: false,
      trending: "+23%",
      creator: "RoyaleStudios"
    }
  ],
  categories: [
    { id: "fps", name: "First Person", collections: 45, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/69281ee0-9883-441a-9a8e-e43ff4e05ad0/original=true,quality=90/94617017.jpeg" },
    { id: "moba", name: "MOBA", collections: 28, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/c51fe7d8-e94f-45ed-b23e-d584c8998118/anim=false,width=450,optimized=true/00586-3019206393.jpeg" },
    { id: "rts", name: "Strategy", collections: 34, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/5683b6d8-fa8c-4d5f-8fdb-b6e98801c82a/anim=false,width=450,optimized=true/01959-1721753241.jpeg" },
    { id: "fighting", name: "Fighting", collections: 19, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/50d09e0b-f10b-400b-9354-2fa908865565/anim=false,width=450,optimized=true/00015-2320167257.jpeg" },
    { id: "racing", name: "Racing", collections: 12, image: "https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1351be80-e8bd-4d05-8d60-31ced9a024ce/original=true,quality=90/96222521.jpeg" }
  ]
};

export function CompetitiveGamingLayout() {
  const account = useActiveAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMuted, setIsMuted] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only use target-based scroll tracking after mount to avoid hydration errors
  const { scrollYProgress } = useScroll(isMounted ? { target: heroRef } : undefined);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Fetch games from tRPC
  const { data: gamesData, isLoading: gamesLoading } = trpc.gaming.games.list.useQuery(
    { category: "competitive" as const },
    { placeholderData: (prev) => prev }
  );

  // Fetch tournaments from tRPC
  const { data: tournamentsData, isLoading: tournamentsLoading } = trpc.gaming.tournaments.list.useQuery(
    { status: "UPCOMING" as const },
    { placeholderData: (prev) => prev }
  );

  // Fetch tournament brackets when selected
  const { data: bracketsData } = trpc.gaming.tournaments.brackets.useQuery(
    { id: selectedTournament?.id || "" },
    { enabled: !!selectedTournament?.id }
  );

  const games = gamesData?.games || [];
  const tournaments = tournamentsData?.tournaments || [];
  const tournamentBrackets = bracketsData;
  const isLoading = gamesLoading || tournamentsLoading;

  const scrollCarousel = (direction: 'left' | 'right', containerId: string) => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full overflow-hidden"
    >
      <div className="relative">
        {/* Hero Banner - Competitive themed */}
        <motion.div
          ref={heroRef}
          className="relative h-[70vh] md:h-[85vh] overflow-hidden"
          style={{ scale: heroScale }}
        >
          <div className="absolute inset-0">
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              loop
              playsInline
            >
              <source src={mockCompetitiveGames.hero.image} type="video/webm" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-900/80 via-red-800/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Navigation - Competitive themed */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="absolute top-0 left-0 right-0 z-20 p-4 md:p-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-8">
                <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Sword className="h-6 w-6 text-orange-400" />
                  Competitive Arena
                </h1>
                <nav className="hidden md:flex items-center gap-6">
                  {["Tournaments", "Leaderboard", "Team Play", "Rankings", "Esports"].map((item) => (
                    <button
                      key={item}
                      className="text-white/80 hover:text-white transition-colors text-lg font-medium"
                    >
                      {item}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4 md:h-5 md:w-5" />
                  <Input
                    placeholder="Find tournaments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 md:pl-10 pr-4 py-2 bg-black/20 backdrop-blur-md border-white/20 text-white placeholder:text-white/60 focus:border-orange-400/40 w-48 md:w-80 text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Hero Content - Competitive themed */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute bottom-0 left-0 right-0 p-4 md:p-8 pb-12 md:pb-20"
          >
            <div className="max-w-3xl">
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mb-4 md:mb-6"
              >
                <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-4">
                  <Badge className="bg-orange-400 text-black font-semibold px-2 md:px-3 py-1 text-xs md:text-sm flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Top Tier
                  </Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-white/80 ml-1 md:ml-2 text-sm md:text-base">{mockCompetitiveGames.hero.rating}</span>
                  </div>
                  <span className="text-white/80 text-sm md:text-base">{mockCompetitiveGames.hero.items.toLocaleString()} Players</span>
                </div>
              </motion.div>

              <motion.h2
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4"
              >
                {mockCompetitiveGames.hero.title}
              </motion.h2>

              <motion.p
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="text-base md:text-xl text-white/90 mb-4 md:mb-6 leading-relaxed"
              >
                {mockCompetitiveGames.hero.description}
              </motion.p>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap items-center gap-2 md:gap-4"
              >
                <Button className="bg-orange-500 text-black hover:bg-orange-600 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base">
                  <Play className="h-4 w-4 md:h-5 md:w-5" fill="currentColor" />
                  <span className="hidden sm:inline">Join Battle</span>
                  <span className="sm:hidden">Fight</span>
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-4 md:px-8 py-2 md:py-3 rounded-lg flex items-center gap-2 text-sm md:text-base">
                  <Target className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="hidden sm:inline">Rankings</span>
                  <span className="sm:hidden">Ranks</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full p-2 md:p-3">
                  <Flame className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 rounded-full p-2 md:p-3"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-5 w-5 md:h-6 md:w-6" /> : <Volume2 className="h-5 w-5 md:h-6 md:w-6" />}
                </Button>
              </motion.div>

              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="flex flex-wrap items-center gap-4 md:gap-6 mt-4 md:mt-6 text-white/80"
              >
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Prize Pool</span>
                  <p className="text-base md:text-lg font-bold text-orange-400">$2.4M</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Live Tournaments</span>
                  <p className="text-base md:text-lg font-bold">24</p>
                </div>
                <div>
                  <span className="text-xs md:text-sm uppercase tracking-wide text-white/60">Active Players</span>
                  <p className="text-base md:text-lg font-bold">8,294</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Categories Row - Competitive Games */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-black"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Game Types</h2>
            <Button variant="ghost" className="text-white/80 hover:text-white flex items-center gap-2">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {mockCompetitiveGames.categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.6 }}
                whileHover={{ scale: 1.03 }}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl">
                  <div className="aspect-[3/4] bg-gradient-to-br from-orange-800 to-red-900">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </div>
                  <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
                    <h3 className="text-white font-bold text-sm md:text-lg mb-1">{category.name}</h3>
                    <p className="text-white/70 text-xs md:text-sm">{category.collections} tournaments</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Live Tournaments Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-zinc-900/50"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Trophy className="h-8 w-8 text-orange-400" />
              Live Tournaments
            </h2>
            <Button variant="ghost" className="text-white/80 hover:text-white flex items-center gap-2">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
            </div>
          ) : tournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.slice(0, 6).map((tournament, index) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="bg-zinc-800/50 border border-white/10 rounded-xl p-6 hover:border-orange-400/50 transition-all cursor-pointer"
                  onClick={() => setSelectedTournament(tournament as unknown as Tournament)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{tournament.name}</h3>
                      <p className="text-sm text-white/60">{tournament.game?.name || "Multiple Games"}</p>
                    </div>
                    <Badge
                      className={
                        tournament.status === "IN_PROGRESS"
                          ? "bg-green-500 text-black"
                          : "bg-orange-400 text-black"
                      }
                    >
                      {tournament.status === "IN_PROGRESS" ? "LIVE" : "Upcoming"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-white/40 uppercase">Prize Pool</p>
                      <p className="text-lg font-bold text-orange-400">{tournament.prizePool} ETH</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase">Entry</p>
                      <p className="text-lg font-bold text-white">{tournament.entryFee} ETH</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 uppercase">Players</p>
                      <p className="text-lg font-bold text-white">
                        {tournament.currentPlayers}/{tournament.maxPlayers}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-sm text-white/60">
                      {new Date(tournament.startTime).toLocaleDateString()}
                    </span>
                    <Button size="sm" className="bg-orange-500 text-black hover:bg-orange-600">
                      {tournament.status === "IN_PROGRESS" ? "Watch" : "Register"}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No active tournaments</p>
              <p className="text-sm text-white/40">Check back later for upcoming events</p>
            </div>
          )}
        </motion.section>

        {/* Tournament Bracket Modal/Section */}
        {selectedTournament && tournamentBrackets && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 md:px-8 py-8 md:py-16 bg-black"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white">{selectedTournament.name}</h2>
                <p className="text-white/60">Tournament Bracket</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectedTournament(null)}
                className="border-white/20 text-white"
              >
                Close Bracket
              </Button>
            </div>
            <TournamentBracket
              tournament={{
                id: selectedTournament.id,
                name: selectedTournament.name,
                format: selectedTournament.format,
                status: selectedTournament.status,
              }}
              brackets={tournamentBrackets?.brackets ?
                (tournamentBrackets.brackets as unknown as Record<number, any[]>) : {}}
              totalRounds={3}
              className="bg-zinc-900/50 rounded-xl p-6"
            />
          </motion.section>
        )}

        {/* Leaderboard Section */}
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="px-4 md:px-8 py-8 md:py-16 bg-black"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <Target className="h-8 w-8 text-orange-400" />
              Global Leaderboard
            </h2>
            <Button
              variant="ghost"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="text-white/80 hover:text-white"
            >
              {showLeaderboard ? "Hide" : "Show"} Full Rankings
            </Button>
          </div>

          <div className="bg-zinc-900/50 rounded-xl border border-white/10">
            <Leaderboard
              limit={showLeaderboard ? 50 : 10}
              showEarnings={true}
              currentUserId={account?.address}
              className="p-4"
            />
          </div>
        </motion.section>

      </div>
    </motion.div>
  );
}