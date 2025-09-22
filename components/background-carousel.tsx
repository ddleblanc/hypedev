"use client";

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useBackgroundCarousel } from '@/contexts/background-carousel-context';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

const BACKGROUND_OPTIONS = [
  { id: 'bg1', src: '/assets/img/bg1.jpg', name: 'Original', type: 'image' },
  { id: 'bg2', src: '/assets/img/bg2.jpg', name: 'Alternative', type: 'image' },
  { id: 'bg5', src: '/assets/img/bg5.jpg', name: 'Variant 5', type: 'image' },
  { id: 'bgv3', src: '/assets/img/bgv3.mp4', name: 'Video 3', type: 'video' },
  { id: 'bgvurl1', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/21018676-5eb7-4306-9099-992a9c99f37a/transcode=true,original=true,quality=90/96694329.webm', name: 'Web Video', type: 'video' },
  { id: 'bgvurl2', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/39561bcd-8a10-4e56-826c-6f3f7c813414/transcode=true,original=true,quality=90/ChicVideo.webm', name: 'Chic Video', type: 'video' },
  { id: 'bgvurl3', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/1ad84358-5802-4eae-b74b-f6c880d38ea5/transcode=true,original=true,quality=90/vid_00005.webm', name: 'Video 5', type: 'video' },
  { id: 'bgvurl4', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/a770baa3-875b-4e1d-9f8f-3a0f533e3f96/transcode=true,original=true,quality=90/Blood%20Moon%20Oni.webm', name: 'Blood Moon', type: 'video' },
  { id: 'bgvurl45', src: 'https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/7f64191f-c494-492e-ab3d-21fb88686523/transcode=true,original=true,quality=90/6JRGQ9C6B2HFZJ94J50N42NPJ0.webm?token=CfDJ8IU-uofjHWVPg1_3zdfXdVM1DITXcjK26rTZ_vSgBMON7cn-5Hl4AXjKzNKtDpWgM1vyLFAaaQOTYAXngeNshK2hchUDWACRROB_CMqEUo8WVGj-YwL9zsZzNiUr8P9Qrb2-fYUTWJFR9leN08g5eAEvNhLDPlRIhzJQ_J_OtG1vJHXmtmkbI4U9HzwrEJ_6mIzNxhxK7TdTQv5IdF-d6mRjZhiFfA2G7uXVfu5tTjmRqwan9Rou9I-n4vAonRsTHA.mp4', name: 'Neon', type: 'video' },

];

export const BackgroundCarousel: React.FC = () => {
  const { isCarouselVisible, currentBackground, setCurrentBackground, hideCarousel } = useBackgroundCarousel();

  const handleBackgroundSelect = (backgroundSrc: string) => {
    setCurrentBackground(backgroundSrc);
    hideCarousel();
  };

  return (
    <AnimatePresence>
      {isCarouselVisible && (
        <>
          {/* Overlay to prevent scrolling */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={hideCarousel}
          />
          
          {/* Carousel - Enhanced with shadcn components */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
            className="fixed bottom-0 left-0 right-0 z-50 overflow-visible"
          >
            <Card className="rounded-t-2xl rounded-b-none border-0 bg-gradient-to-b from-black/95 to-black backdrop-blur-2xl">
              <div className="px-6 pb-12 pt-12 overflow-visible">
                <div className="flex justify-center gap-4">
                    {BACKGROUND_OPTIONS.map((bg, index) => (
                      <motion.div
                        key={bg.id}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          delay: 0.1 + index * 0.03,
                          duration: 0.4,
                          type: "spring",
                          stiffness: 260,
                          damping: 20
                        }}
                      >
                        <Card 
                          className={`relative group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-2 ${
                            currentBackground === bg.src 
                              ? 'ring-2 ring-[rgb(163,255,18)] ring-offset-2 ring-offset-black' 
                              : 'hover:ring-2 hover:ring-white/20 hover:ring-offset-2 hover:ring-offset-black'
                          }`}
                          onClick={() => handleBackgroundSelect(bg.src)}
                        >
                          <div className="relative w-40 h-24">
                            {bg.type === 'video' ? (
                              <video
                                src={bg.src}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                playsInline
                                onLoadedData={(e) => {
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
                            
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60" />
                            
                            {/* Selected indicator */}
                            {currentBackground === bg.src && (
                              <div className="absolute inset-0 bg-[rgb(163,255,18)]/10 flex items-center justify-center">
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="bg-[rgb(163,255,18)] rounded-full p-2"
                                >
                                  <Check className="w-5 h-5 text-black" strokeWidth={3} />
                                </motion.div>
                              </div>
                            )}
                            
                            
                            {/* Name label */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                              <p className="text-white text-sm font-semibold truncate">
                                {bg.name}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </div>
            </Card>
          </motion.div>
    </>
  )}
    </AnimatePresence>
  );
};