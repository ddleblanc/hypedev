"use client";

import React, { useEffect } from "react";

export interface GameOption {
  id: string;
  title: string;
  description: string;
  image: string;
  href?: string;
  category: string;
  accentColor: 'amber' | 'blue' | 'purple' | 'red' | 'green' | 'cyan' | 'pink' | 'orange';
}

interface GameCommandCenterProps {
  options: GameOption[];
  onOptionClick: (option: GameOption) => void;
  centerLabel?: string;
}

const accentColorClasses = {
  amber: {
    text: 'text-amber-400',
    bg: 'bg-amber-400',
    particle: 'bg-amber-400',
    gradient: 'from-amber-900/40'
  },
  blue: {
    text: 'text-blue-400', 
    bg: 'bg-blue-400',
    particle: 'bg-blue-400',
    gradient: 'from-blue-900/40'
  },
  purple: {
    text: 'text-purple-400',
    bg: 'bg-purple-400', 
    particle: 'bg-purple-400',
    gradient: 'from-purple-900/40'
  },
  red: {
    text: 'text-red-400',
    bg: 'bg-red-400',
    particle: 'bg-red-400', 
    gradient: 'from-red-900/40'
  },
  green: {
    text: 'text-green-400',
    bg: 'bg-green-400',
    particle: 'bg-green-400',
    gradient: 'from-green-900/40'
  },
  cyan: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-400',
    particle: 'bg-cyan-400',
    gradient: 'from-cyan-900/40'
  },
  pink: {
    text: 'text-pink-400',
    bg: 'bg-pink-400',
    particle: 'bg-pink-400',
    gradient: 'from-pink-900/40'
  },
  orange: {
    text: 'text-orange-400',
    bg: 'bg-orange-400',
    particle: 'bg-orange-400',
    gradient: 'from-orange-900/40'
  }
};

const clipPathStyles = [
  'polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 0 100%)', // top-left
  'polygon(30px 0, 100% 0, 100% 100%, 0 100%, 0 30px)', // top-right
  'polygon(0 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%)', // bottom-left
  'polygon(0 0, 100% 0, 100% 100%, 30px 100%, 0 calc(100% - 30px))' // bottom-right
];

const gradientDirections = ['br', 'bl', 'tr', 'tl'];

export function GameCommandCenter({ options, onOptionClick, centerLabel = "SELECT" }: GameCommandCenterProps) {
  // Add custom keyframes for AAA game-style animations
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes expandFromCenter {
        0% {
          transform: scale(0.3);
          opacity: 0;
          filter: blur(8px);
        }
        100% {
          transform: scale(1);
          opacity: 1;
          filter: blur(0px);
        }
      }
      
      @keyframes pulseGlow {
        0%, 100% {
          box-shadow: 0 0 20px rgba(163, 255, 18, 0.3), 0 0 40px rgba(163, 255, 18, 0.1);
        }
        50% {
          box-shadow: 0 0 30px rgba(163, 255, 18, 0.6), 0 0 60px rgba(163, 255, 18, 0.2);
        }
      }
      
      @keyframes particleFloat {
        0% {
          transform: translateY(0px) rotate(0deg);
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          transform: translateY(-30px) rotate(360deg);
          opacity: 0;
        }
      }
      
      @keyframes borderScan {
        0% {
          background-position: -200% 0;
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          background-position: 200% 0;
          opacity: 0;
        }
      }
      
      @keyframes hoverShimmer {
        0% {
          background-position: -200% 0;
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          background-position: 200% 0;
          opacity: 0;
        }
      }
      
      @keyframes hologramFlicker {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  if (options.length !== 4) {
    console.warn('GameCommandCenter expects exactly 4 options');
  }

  return (
    <div className="relative grid grid-cols-2 gap-8 h-[600px]">
      {options.slice(0, 4).map((option, index) => {
          const colorClasses = accentColorClasses[option.accentColor];
          const clipPath = clipPathStyles[index];
          const gradientDir = gradientDirections[index];
          
          return (
            <div
              key={option.id}
              className="group cursor-pointer relative overflow-hidden animate-[expandFromCenter_0.5s_ease-out_both]"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => onOptionClick(option)}
              onMouseEnter={(e) => {
                const video = e.currentTarget.querySelector('video');
                if (video) video.play();
              }}
              onMouseLeave={(e) => {
                const video = e.currentTarget.querySelector('video');
                if (video) video.pause();
              }}
            >
              <div 
                className="relative h-full bg-black/20 backdrop-blur-sm border border-white/20 hover:border-[rgb(163,255,18)]/60 transition-all duration-500 hover:scale-[1.02] group-hover:animate-[pulseGlow_2s_infinite]"
                style={{ clipPath }}
              >
                {/* Video Background */}
                <div className="absolute inset-0 overflow-hidden">
                  <video
                    src={option.image}
                    loop
                    muted
                    className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-${gradientDir} ${colorClasses.gradient} via-transparent to-black/60`} />
                </div>
                
                {/* Load Shimmer Effect */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(163,255,18,0.3), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'borderScan 1s ease-out',
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'both',
                    clipPath
                  }} 
                />
                
                {/* Hover Shimmer Effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:animate-[hoverShimmer_0.6s_ease-out]"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(163,255,18,0.5), transparent)',
                    backgroundSize: '200% 100%',
                    clipPath
                  }} 
                />
                
                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`${colorClasses.text} text-sm font-bold tracking-widest mb-2 opacity-80`}>
                        {option.category}
                      </div>
                      <h2 className="text-white text-4xl font-black tracking-wider group-hover:text-[rgb(163,255,18)] transition-colors duration-300">
                        {option.title}
                      </h2>
                    </div>
                    <div className={`w-3 h-3 ${colorClasses.bg} rounded-full animate-pulse`} />
                  </div>
                  
                  <div>
                    <p className="text-white/80 text-lg font-medium leading-relaxed mb-4 group-hover:text-white/100 transition-colors duration-300">
                      {option.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-0.5 bg-[rgb(163,255,18)]" />
                      <span className="text-[rgb(163,255,18)] text-sm font-bold tracking-wider">ENTER</span>
                    </div>
                  </div>
                </div>
                
                {/* Particle Effects */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-1 h-1 ${colorClasses.particle} rounded-full animate-[particleFloat_3s_linear_infinite]`}
                      style={{
                        left: index % 2 === 0 ? `${20 + i * 15}%` : `${80 - i * 15}%`,
                        [index < 2 ? 'bottom' : 'top']: index < 2 ? '20px' : `${60 + i * 5}%`,
                        animationDelay: `${i * 0.5}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      
      {/* Central Holographic Display */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="w-32 h-32 rounded-full border border-[rgb(163,255,18)]/30 flex items-center justify-center animate-[hologramFlicker_3s_ease-in-out_infinite]">
          <div className="w-16 h-16 rounded-full bg-[rgb(163,255,18)]/10 flex items-center justify-center">
            <div className="text-[rgb(163,255,18)] font-black text-lg tracking-widest">
              {centerLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}