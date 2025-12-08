"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Palette,
  Gamepad2,
  Users,
  Music,
  Camera,
  Video,
  Sparkles,
  Globe,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  name: string;
  slug: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  bgColor: string;
  glowColor: string;
  gradient: string;
}

const CATEGORIES: Category[] = [
  {
    name: "All",
    slug: "all",
    icon: <Globe className="w-5 h-5" />,
    color: "text-white",
    hoverColor: "group-hover:text-white",
    bgColor: "bg-white/5",
    glowColor: "group-hover:shadow-white/20",
    gradient: "from-white/20 to-white/5",
  },
  {
    name: "Art",
    slug: "art",
    icon: <Palette className="w-5 h-5" />,
    color: "text-purple-400",
    hoverColor: "group-hover:text-purple-300",
    bgColor: "bg-purple-500/10",
    glowColor: "group-hover:shadow-purple-500/30",
    gradient: "from-purple-500/20 to-purple-500/5",
  },
  {
    name: "Gaming",
    slug: "gaming",
    icon: <Gamepad2 className="w-5 h-5" />,
    color: "text-green-400",
    hoverColor: "group-hover:text-green-300",
    bgColor: "bg-green-500/10",
    glowColor: "group-hover:shadow-green-500/30",
    gradient: "from-green-500/20 to-green-500/5",
  },
  {
    name: "PFPs",
    slug: "pfps",
    icon: <Users className="w-5 h-5" />,
    color: "text-blue-400",
    hoverColor: "group-hover:text-blue-300",
    bgColor: "bg-blue-500/10",
    glowColor: "group-hover:shadow-blue-500/30",
    gradient: "from-blue-500/20 to-blue-500/5",
  },
  {
    name: "Music",
    slug: "music",
    icon: <Music className="w-5 h-5" />,
    color: "text-pink-400",
    hoverColor: "group-hover:text-pink-300",
    bgColor: "bg-pink-500/10",
    glowColor: "group-hover:shadow-pink-500/30",
    gradient: "from-pink-500/20 to-pink-500/5",
  },
  {
    name: "Photography",
    slug: "photography",
    icon: <Camera className="w-5 h-5" />,
    color: "text-amber-400",
    hoverColor: "group-hover:text-amber-300",
    bgColor: "bg-amber-500/10",
    glowColor: "group-hover:shadow-amber-500/30",
    gradient: "from-amber-500/20 to-amber-500/5",
  },
  {
    name: "Video",
    slug: "video",
    icon: <Video className="w-5 h-5" />,
    color: "text-red-400",
    hoverColor: "group-hover:text-red-300",
    bgColor: "bg-red-500/10",
    glowColor: "group-hover:shadow-red-500/30",
    gradient: "from-red-500/20 to-red-500/5",
  },
  {
    name: "Collectibles",
    slug: "collectibles",
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-[rgb(163,255,18)]",
    hoverColor: "group-hover:text-[rgb(183,255,58)]",
    bgColor: "bg-[rgb(163,255,18)]/10",
    glowColor: "group-hover:shadow-[rgb(163,255,18)]/30",
    gradient: "from-[rgb(163,255,18)]/20 to-[rgb(163,255,18)]/5",
  },
];

interface CategoryNavigationProps {
  className?: string;
  onCategoryChange?: (slug: string) => void;
}

export function CategoryNavigation({
  className,
  onCategoryChange,
}: CategoryNavigationProps) {
  const [selected, setSelected] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Initial scroll check
  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleSelect = (slug: string) => {
    setSelected(slug);
    onCategoryChange?.(slug);
  };

  return (
    <div className={cn("relative group/nav", className)}>
      {/* Gradient fade edges */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none",
        "bg-gradient-to-r from-black to-transparent",
        canScrollLeft ? "opacity-100" : "opacity-0",
        "transition-opacity duration-300"
      )} />
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none",
        "bg-gradient-to-l from-black to-transparent",
        canScrollRight ? "opacity-100" : "opacity-0",
        "transition-opacity duration-300"
      )} />

      {/* Scroll buttons */}
      {canScrollLeft && (
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          onClick={() => scroll("left")}
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 z-20",
            "w-9 h-9 rounded-full flex items-center justify-center",
            "bg-black/90 backdrop-blur-md border border-white/10",
            "text-white/70 hover:text-white hover:border-white/20",
            "transition-all duration-200",
            "shadow-lg hover:shadow-xl"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
      )}
      {canScrollRight && (
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          onClick={() => scroll("right")}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-20",
            "w-9 h-9 rounded-full flex items-center justify-center",
            "bg-black/90 backdrop-blur-md border border-white/10",
            "text-white/70 hover:text-white hover:border-white/20",
            "transition-all duration-200",
            "shadow-lg hover:shadow-xl"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      )}

      {/* Category pills */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-1"
      >
        {CATEGORIES.map((category, index) => {
          const isSelected = selected === category.slug;

          return (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
            >
              <Link
                href={
                  category.slug === "all"
                    ? "/marketplace"
                    : `/marketplace?category=${category.slug}`
                }
                onClick={(e) => {
                  if (onCategoryChange) {
                    e.preventDefault();
                    handleSelect(category.slug);
                  }
                }}
                className={cn(
                  "group flex items-center gap-2.5 px-4 py-2.5 rounded-full",
                  "whitespace-nowrap transition-all duration-300",
                  "border relative overflow-hidden",
                  isSelected
                    ? cn(
                        "bg-white text-black border-white",
                        "shadow-lg shadow-white/25"
                      )
                    : cn(
                        category.bgColor,
                        category.color,
                        "border-white/5 hover:border-white/15",
                        category.glowColor,
                        "hover:shadow-lg"
                      )
                )}
              >
                {/* Background gradient on hover */}
                {!isSelected && (
                  <div
                    className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100",
                      "bg-gradient-to-r transition-opacity duration-300",
                      category.gradient
                    )}
                  />
                )}

                {/* Icon container with glow */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center",
                  "transition-transform duration-300 group-hover:scale-110",
                  isSelected ? "text-black" : cn(category.color, category.hoverColor)
                )}>
                  {category.icon}
                </div>

                {/* Category name */}
                <span className={cn(
                  "font-medium text-sm md:text-base relative z-10",
                  "transition-colors duration-300",
                  isSelected ? "text-black" : "text-white/90 group-hover:text-white"
                )}>
                  {category.name}
                </span>

                {/* Active indicator dot */}
                {isSelected && (
                  <motion.div
                    layoutId="active-category-indicator"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
