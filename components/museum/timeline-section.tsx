"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, CheckCircle, XCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import type { LegendTimelineEvent } from "@prisma/client";

interface TimelineSectionProps {
  timeline: LegendTimelineEvent[];
  legendId: string;
  primaryColor: string;
}

export function TimelineSection({ timeline, legendId, primaryColor }: TimelineSectionProps) {
  const [activeEvent, setActiveEvent] = useState<LegendTimelineEvent | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const { mutate: updateProgress } = trpc.museum.progress.update.useMutation();

  const handleEventClick = (event: LegendTimelineEvent) => {
    setActiveEvent(event);
    setShowQuiz(false);
    updateProgress({
      legendId,
      action: "view_timeline_event",
      targetId: event.id,
    });
  };

  if (timeline.length === 0) {
    return null;
  }

  return (
    <section className="py-24 px-8 md:px-16 bg-gradient-to-b from-black to-[#050505]">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-4xl font-light text-white mb-4 text-center">
          Timeline
        </h2>
        <p className="text-white/50 text-center mb-16 max-w-xl mx-auto">
          Explore key moments in this legend&apos;s journey. Click on events to learn more
          and test your knowledge.
        </p>

        {/* Timeline */}
        <div className="relative">
          {/* Center line */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 hidden md:block"
            style={{ backgroundColor: `${primaryColor}30` }}
          />
          {/* Mobile line (left aligned) */}
          <div
            className="absolute left-6 top-0 bottom-0 w-px md:hidden"
            style={{ backgroundColor: `${primaryColor}30` }}
          />

          {/* Events */}
          <div className="space-y-12">
            {timeline.map((event, index) => (
              <TimelineEventItem
                key={event.id}
                event={event}
                index={index}
                isActive={activeEvent?.id === event.id}
                primaryColor={primaryColor}
                onClick={() => handleEventClick(event)}
              />
            ))}
          </div>
        </div>

        {/* Event Detail Modal */}
        <AnimatePresence>
          {activeEvent && (
            <TimelineEventModal
              event={activeEvent}
              onClose={() => {
                setActiveEvent(null);
                setShowQuiz(false);
              }}
              showQuiz={showQuiz}
              onShowQuiz={() => setShowQuiz(true)}
              legendId={legendId}
              primaryColor={primaryColor}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

// Timeline Event Item
interface TimelineEventItemProps {
  event: LegendTimelineEvent;
  index: number;
  isActive: boolean;
  primaryColor: string;
  onClick: () => void;
}

function TimelineEventItem({
  event,
  index,
  isActive,
  primaryColor,
  onClick,
}: TimelineEventItemProps) {
  const isEven = index % 2 === 0;

  return (
    <motion.div
      className={`relative flex items-center gap-8 ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      } flex-row`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      {/* Content */}
      <div
        className={`flex-1 ${isEven ? "md:text-right md:pr-8" : "md:text-left md:pl-8"} text-left pl-12 md:pl-0`}
      >
        <motion.div
          className="inline-block bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 cursor-pointer transition-all max-w-md text-left"
          whileHover={{ scale: 1.02 }}
          onClick={onClick}
        >
          <p className="text-2xl font-light text-white mb-2">{event.year}</p>
          <h4 className="text-lg font-medium text-white mb-2">{event.event}</h4>
          <p className="text-sm text-white/50 line-clamp-2">{event.detail}</p>

          {event.hasQuiz && (
            <div
              className="flex items-center gap-2 mt-4 text-xs"
              style={{ color: primaryColor }}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Quiz available</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Center dot - Desktop */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 hidden md:block"
        style={{
          backgroundColor: isActive ? primaryColor : "black",
          borderColor: primaryColor,
        }}
      />

      {/* Left dot - Mobile */}
      <div
        className="absolute left-4 w-4 h-4 rounded-full border-2 md:hidden"
        style={{
          backgroundColor: isActive ? primaryColor : "black",
          borderColor: primaryColor,
        }}
      />

      {/* Spacer for opposite side */}
      <div className="flex-1 hidden md:block" />
    </motion.div>
  );
}

// Event Detail Modal
interface TimelineEventModalProps {
  event: LegendTimelineEvent;
  onClose: () => void;
  showQuiz: boolean;
  onShowQuiz: () => void;
  legendId: string;
  primaryColor: string;
}

function TimelineEventModal({
  event,
  onClose,
  showQuiz,
  onShowQuiz,
  legendId,
  primaryColor,
}: TimelineEventModalProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const { mutate: updateProgress } = trpc.museum.progress.update.useMutation();

  const quizOptions = event.quizOptions as string[] | null;
  const isCorrect = selectedAnswer === event.quizCorrectIndex;

  const handleSubmitQuiz = () => {
    if (selectedAnswer === null) return;

    setQuizSubmitted(true);

    if (isCorrect) {
      updateProgress({
        legendId,
        action: "complete_quiz",
        targetId: event.id,
        quizScore: event.quizPoints || 100,
      });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#0a0a0a] rounded-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10 relative"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Image */}
        {event.mediaUrl && (
          <div className="relative aspect-video">
            <img
              src={event.mediaUrl}
              alt={event.event}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="p-8">
          <p className="text-3xl font-light text-white mb-2">{event.year}</p>
          <h3 className="text-xl font-medium text-white mb-4">{event.event}</h3>
          <p className="text-white/70 font-light leading-relaxed mb-8">{event.detail}</p>

          {/* Quiz Section */}
          {event.hasQuiz && quizOptions && !showQuiz && (
            <Button
              onClick={onShowQuiz}
              className="w-full"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              <HelpCircle className="w-5 h-5 mr-2" />
              Take Quiz (+{event.quizPoints} points)
            </Button>
          )}

          {showQuiz && quizOptions && (
            <div className="border-t border-white/10 pt-8">
              <h4 className="text-lg font-medium text-white mb-4">{event.quizQuestion}</h4>

              <div className="space-y-3 mb-6">
                {quizOptions.map((option, index) => (
                  <button
                    key={index}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedAnswer === index
                        ? "border-white/40 bg-white/10"
                        : "border-white/10 hover:border-white/20"
                    } ${
                      quizSubmitted && index === event.quizCorrectIndex
                        ? "border-green-500/50 bg-green-500/10"
                        : quizSubmitted && selectedAnswer === index && !isCorrect
                          ? "border-red-500/50 bg-red-500/10"
                          : ""
                    }`}
                    onClick={() => !quizSubmitted && setSelectedAnswer(index)}
                    disabled={quizSubmitted}
                  >
                    <span className="text-white/80">{option}</span>
                    {quizSubmitted && index === event.quizCorrectIndex && (
                      <CheckCircle className="inline ml-2 w-5 h-5 text-green-400" />
                    )}
                    {quizSubmitted && selectedAnswer === index && !isCorrect && (
                      <XCircle className="inline ml-2 w-5 h-5 text-red-400" />
                    )}
                  </button>
                ))}
              </div>

              {!quizSubmitted ? (
                <Button
                  onClick={handleSubmitQuiz}
                  disabled={selectedAnswer === null}
                  className="w-full"
                  style={{ backgroundColor: primaryColor, color: "#000" }}
                >
                  Submit Answer
                </Button>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p
                    className={`text-lg font-medium mb-2 ${isCorrect ? "text-green-400" : "text-red-400"}`}
                  >
                    {isCorrect ? `Correct! +${event.quizPoints} points` : "Not quite right"}
                  </p>
                  <p className="text-white/60 text-sm">{event.quizExplanation}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <Button variant="outline" onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
