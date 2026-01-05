"use client";

import React from "react";
import { motion } from "framer-motion";
import { Zap, Lightbulb, Crown, TrendingUp } from "lucide-react";

interface StorySectionProps {
  challenge: string;
  breakthrough: string;
  legacy: string;
  modernImpact: string;
  primaryColor: string;
}

interface StoryItem {
  icon: React.ElementType;
  title: string;
  content: string;
  delay: number;
}

export function StorySection({
  challenge,
  breakthrough,
  legacy,
  modernImpact,
  primaryColor,
}: StorySectionProps) {
  const sections: StoryItem[] = [
    {
      icon: Zap,
      title: "The Challenge",
      content: challenge,
      delay: 0,
    },
    {
      icon: Lightbulb,
      title: "The Breakthrough",
      content: breakthrough,
      delay: 0.1,
    },
    {
      icon: Crown,
      title: "The Legacy",
      content: legacy,
      delay: 0.2,
    },
    {
      icon: TrendingUp,
      title: "Modern Impact",
      content: modernImpact,
      delay: 0.3,
    },
  ];

  // Filter out empty sections
  const visibleSections = sections.filter((section) => section.content);

  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <section className="py-24 px-8 md:px-16 bg-black">
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-light text-white mb-16 text-center">
          The Story
        </h2>

        <div className="space-y-16">
          {visibleSections.map((section, index) => (
            <motion.div
              key={section.title}
              className="relative pl-16 md:pl-24"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: section.delay, duration: 0.6 }}
              viewport={{ once: true }}
            >
              {/* Icon */}
              <div
                className="absolute left-0 top-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <section.icon className="w-6 h-6" style={{ color: primaryColor }} />
              </div>

              {/* Connecting line */}
              {index < visibleSections.length - 1 && (
                <div
                  className="absolute left-6 top-14 w-px h-[calc(100%+32px)]"
                  style={{ backgroundColor: `${primaryColor}20` }}
                />
              )}

              {/* Content */}
              <div>
                <h3 className="text-xl font-medium mb-4" style={{ color: primaryColor }}>
                  {section.title}
                </h3>
                <p className="text-white/70 font-light leading-relaxed text-lg">
                  {section.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
