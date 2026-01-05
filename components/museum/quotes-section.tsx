"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LegendQuote } from "@prisma/client";

interface QuotesSectionProps {
  quotes: LegendQuote[];
  primaryColor: string;
}

export function QuotesSection({ quotes, primaryColor }: QuotesSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "center",
      loop: true,
    },
    [Autoplay({ delay: 6000, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (quotes.length === 0) return null;

  return (
    <section className="py-24 px-8 md:px-16 bg-black relative overflow-hidden">
      {/* Background quote mark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <Quote className="w-96 h-96 opacity-[0.02]" style={{ color: primaryColor }} />
      </div>

      <motion.div
        className="max-w-4xl mx-auto relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-light text-white mb-16 text-center">
          In Their Words
        </h2>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {quotes.map((quote, index) => (
                <div key={quote.id} className="flex-shrink-0 w-full px-8">
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: selectedIndex === index ? 1 : 0.3, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Quote
                      className="w-12 h-12 mx-auto mb-6 opacity-30"
                      style={{ color: primaryColor }}
                    />
                    <blockquote className="text-xl md:text-2xl lg:text-3xl font-light text-white leading-relaxed mb-8">
                      &ldquo;{quote.text}&rdquo;
                    </blockquote>
                    <div className="text-white/50">
                      <p className="text-sm">{quote.context}</p>
                      {quote.year && <p className="text-xs mt-1 opacity-60">{quote.year}</p>}
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {quotes.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 text-white rounded-full"
                onClick={scrollPrev}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/5 hover:bg-white/10 text-white rounded-full"
                onClick={scrollNext}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>

        {/* Pagination dots */}
        {quotes.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {quotes.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  selectedIndex === index ? "w-6" : "bg-white/20"
                }`}
                style={{
                  backgroundColor: selectedIndex === index ? primaryColor : undefined,
                }}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to quote ${index + 1}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
