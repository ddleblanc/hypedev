"use client";

import React, { useEffect } from "react";
import clsx from "clsx";

export interface GameCommandCardOption {
  id: string;
  title: string;
  description: string;
  image: string;               // video src
  category: string;
  accentColor: 'amber' | 'blue' | 'purple' | 'red' | 'green' | 'cyan' | 'pink' | 'orange';
}

type CardCorner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

const accentColorClasses = {
  amber: { text: 'text-amber-400', bg: 'bg-amber-400', particle: 'bg-amber-400', gradient: 'from-amber-900/40' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-400', particle: 'bg-blue-400', gradient: 'from-blue-900/40' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-400', particle: 'bg-purple-400', gradient: 'from-purple-900/40' },
  red: { text: 'text-red-400', bg: 'bg-red-400', particle: 'bg-red-400', gradient: 'from-red-900/40' },
  green: { text: 'text-green-400', bg: 'bg-green-400', particle: 'bg-green-400', gradient: 'from-green-900/40' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-400', particle: 'bg-cyan-400', gradient: 'from-cyan-900/40' },
  pink: { text: 'text-pink-400', bg: 'bg-pink-400', particle: 'bg-pink-400', gradient: 'from-pink-900/40' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-400', particle: 'bg-orange-400', gradient: 'from-orange-900/40' }
};

// Use explicit Tailwind classes (no dynamic bg-gradient-to-${x})
const cornerVisuals: Record<CardCorner, {
  clipPath: string;
  gradientClass: string;
  defaultDelay: string;
  particleFrom: 'top' | 'bottom';
}> = {
  topRight: {
    clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)',
    gradientClass: 'bg-gradient-to-br',
    defaultDelay: '0s',
    particleFrom: 'bottom'
  },
  topLeft: {
    clipPath: 'polygon(30px 0, 100% 0, 100% 100%, 0 100%, 0 30px)',
    gradientClass: 'bg-gradient-to-bl',
    defaultDelay: '0.1s',
    particleFrom: 'bottom'
  },
  bottomRight: {
    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)',
    gradientClass: 'bg-gradient-to-tr',
    defaultDelay: '0.2s',
    particleFrom: 'top'
  },
  bottomLeft: {
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 30px 100%, 0 calc(100% - 30px))',
    gradientClass: 'bg-gradient-to-tl',
    defaultDelay: '0.3s',
    particleFrom: 'top'
  }
};

function useGameCardKeyframes() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "game-command-card-keyframes";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes expandFromCenter {
        0% { transform: scale(0.3); opacity: 0; filter: blur(8px); }
        100% { transform: scale(1); opacity: 1; filter: blur(0px); }
      }
      @keyframes pulseGlow {
        0%,100% { box-shadow: 0 0 20px rgba(163,255,18,.3), 0 0 40px rgba(163,255,18,.1); }
        50% { box-shadow: 0 0 30px rgba(163,255,18,.6), 0 0 60px rgba(163,255,18,.2); }
      }
      @keyframes particleFloat {
        0% { transform: translateY(0) rotate(0); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(-30px) rotate(360deg); opacity: 0; }
      }
      @keyframes borderScan {
        0% { background-position: -200% 0; opacity: 0; }
        50% { opacity: 1; }
        100% { background-position: 200% 0; opacity: 0; }
      }
      @keyframes hoverShimmer {
        0% { background-position: -200% 0; opacity: 0; }
        50% { opacity: 1; }
        100% { background-position: 200% 0; opacity: 0; }
      }
      @keyframes hologramFlicker {
        0%,100% { opacity: 1; }
        50% { opacity: .8; }
      }
    `;
    document.head.appendChild(style);
  }, []);
}

interface GameCommandCardProps {
  option: GameCommandCardOption;
  onClick?: (option: GameCommandCardOption) => void;
  corner?: CardCorner;
  className?: string;
  shimmer?: boolean;   // enable/disable shimmer layers
  pulse?: boolean;     // enable/disable pulsing glow
}

export function GameCommandCard({
  option,
  onClick,
  corner = "topLeft",
  className,
  shimmer = true,
  pulse = true,
}: GameCommandCardProps) {
  useGameCardKeyframes();

  const colors = accentColorClasses[option.accentColor];
  const { clipPath, gradientClass, defaultDelay, particleFrom } = cornerVisuals[corner];

  return (
    <div
      className={clsx(
        "group cursor-pointer relative overflow-hidden animate-[expandFromCenter_0.5s_ease-out_both]",
        className
      )}
      style={{ animationDelay: defaultDelay }}
      onClick={() => onClick?.(option)}
      onMouseEnter={(e) => {
        const video = e.currentTarget.querySelector("video");
        if (video) (video as HTMLVideoElement).play();
      }}
      onMouseLeave={(e) => {
        const video = e.currentTarget.querySelector("video");
        if (video) (video as HTMLVideoElement).pause();
      }}
    >
      <div
        className={clsx(
          "relative h-full bg-black/20 backdrop-blur-sm border border-black/20 transition-all duration-500 hover:scale-[1.02]",
          pulse && "group-hover:animate-[pulseGlow_2s_infinite]",
          "hover:border-[rgb(163,255,18)]/60"
        )}
        style={{ clipPath }}
      >
        {/* Video background */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            src={option.image}
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-500"
          />
          <div className={clsx("absolute inset-0", gradientClass, colors.gradient, "via-transparent to-black/60")} />
        </div>

        {/* Load shimmer / border scan */}
        {shimmer && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(163,255,18,0.3), transparent)",
              backgroundSize: "200% 100%",
              animation: "borderScan 1s ease-out both",
              animationDelay: defaultDelay,
              clipPath
            }}
          />
        )}

        {/* Hover shimmer sweep */}
        {shimmer && (
          <div
            className="absolute inset-0 opacity-0 pointer-events-none group-hover:animate-[hoverShimmer_0.6s_ease-out]"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(163,255,18,0.5), transparent)",
              backgroundSize: "200% 100%",
              clipPath
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-8">
          <div className="flex items-start justify-between">
            <div>
              <div className={clsx(colors.text, "text-sm font-bold tracking-widest mb-2 opacity-80")}>
                {option.category}
              </div>
              <h2 className="text-white text-4xl font-black tracking-wider">
                {option.title}
              </h2>
            </div>
            <div className={clsx("w-3 h-3 rounded-full animate-pulse", colors.bg)} />
          </div>

          <div>
            <p className="text-white/80 text-lg font-medium leading-relaxed mb-4 group-hover:text-white transition-colors duration-300">
              {option.description}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-[rgb(163,255,18)]" />
              <span className="text-[rgb(163,255,18)] text-sm font-bold tracking-wider">ENTER</span>
            </div>
          </div>
        </div>

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={clsx("absolute w-1 h-1 rounded-full animate-[particleFloat_3s_linear_infinite]", colors.particle)}
              style={{
                left: `${20 + i * 15}%`,
                [particleFrom]: `${20 + i * 10}px`,
                animationDelay: `${i * 0.5}s`
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
