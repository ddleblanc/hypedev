"use client";

import React from 'react';
import Image from 'next/image';
import { useBackgroundCarousel } from '@/contexts/background-carousel-context';

const BACKGROUND_OPTIONS = [
  { id: 'bg1', src: '/assets/img/bg1.jpg', name: 'Original', type: 'image' },
  { id: 'bg2', src: '/assets/img/bg2.jpg', name: 'Alternative', type: 'image' },
  { id: 'bg5', src: '/assets/img/bg5.jpg', name: 'Variant 5', type: 'image' },
  { id: 'bgv3', src: '/assets/img/bgv3.mp4', name: 'Video 3', type: 'video' },
  { id: 'bgvurl1', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/21018676-5eb7-4306-9099-992a9c99f37a/transcode=true,original=true,quality=90/96694329.webm', name: 'Web Video', type: 'video' },
  { id: 'bgvurl2', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/39561bcd-8a10-4e56-826c-6f3f7c813414/transcode=true,original=true,quality=90/ChicVideo.webm', name: 'Chic Video', type: 'video' },
  { id: 'bgvurl3', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1ad84358-5802-4eae-b74b-f6c880d38ea5/transcode=true,original=true,quality=90/vid_00005.webm', name: 'Video 5', type: 'video' },
  { id: 'bgvurl4', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/a770baa3-875b-4e1d-9f8f-3a0f533e3f96/transcode=true,original=true,quality=90/Blood%20Moon%20Oni.webm', name: 'Blood Moon', type: 'video' },
];

export const BackgroundCarousel: React.FC = () => {
  const { isCarouselVisible, currentBackground, setCurrentBackground, hideCarousel } = useBackgroundCarousel();

  const handleBackgroundSelect = (backgroundSrc: string) => {
    setCurrentBackground(backgroundSrc);
    hideCarousel();
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-t border-white/20 transition-transform duration-700 ease-in-out ${
      isCarouselVisible 
        ? 'translate-y-0' 
        : 'translate-y-full'
    }`}>
      <div className="p-8">
        <div className="flex items-center justify-center mb-6">
          <h3 className="text-white text-2xl font-bold tracking-wider">CHOOSE WALLPAPER</h3>
        </div>
        
        <div className="flex justify-center gap-6 max-w-4xl mx-auto">
          {BACKGROUND_OPTIONS.map((bg) => (
            <button
              key={bg.id}
              onClick={() => handleBackgroundSelect(bg.src)}
              className={`relative flex-shrink-0 w-32 h-20 rounded-xl overflow-hidden border-2 transition-all duration-500 hover:scale-110 hover:-translate-y-2 ${
                currentBackground === bg.src 
                  ? 'border-[rgb(163,255,18)] shadow-lg shadow-[rgb(163,255,18)]/25 scale-105' 
                  : 'border-white/30 hover:border-white/60'
              }`}
            >
              {bg.type === 'video' ? (
                <video
                  src={bg.src}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  onLoadedData={(e) => {
                    // Set video to first frame for thumbnail
                    (e.target as HTMLVideoElement).currentTime = 1;
                  }}
                />
              ) : (
                <Image
                  src={bg.src}
                  alt={bg.name}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              
              {/* Video indicator */}
              {bg.type === 'video' && (
                <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1">
                  <div className="w-3 h-3 bg-white rounded-sm flex items-center justify-center">
                    <div className="w-0 h-0 border-l-2 border-l-black border-y-1 border-y-transparent ml-px" />
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-sm font-bold tracking-wide truncate">{bg.name}</p>
              </div>
              {currentBackground === bg.src && (
                <div className="absolute inset-0 bg-[rgb(163,255,18)]/20 flex items-center justify-center">
                  <div className="w-6 h-6 bg-[rgb(163,255,18)] rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};