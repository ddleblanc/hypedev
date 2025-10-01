"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Star,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MagicDateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  label?: string;
  previousPhaseEnd?: Date;
  phaseIndex?: number;
}

export function MagicDateTimePicker({
  value,
  onChange,
  minDate,
  maxDate,
  className,
  label,
  previousPhaseEnd,
  phaseIndex = 0
}: MagicDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"date" | "time">("date");
  const [selectedDate, setSelectedDate] = useState(value || new Date());
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [selectedHour, setSelectedHour] = useState(value?.getHours() || 0);
  const [selectedMinute, setSelectedMinute] = useState(value?.getMinutes() || 0);
  const [isPM, setIsPM] = useState(selectedHour >= 12);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  // Smart presets based on context
  const getQuickPresets = () => {
    // For subsequent phases, show relative options to previous phase
    if (previousPhaseEnd && phaseIndex > 0) {
      const baseDate = previousPhaseEnd instanceof Date ? previousPhaseEnd : new Date(previousPhaseEnd);

      return [
        {
          label: "+1 Hour",
          icon: Zap,
          date: () => new Date(baseDate.getTime() + 60 * 60 * 1000) // 1 hour after previous starts
        },
        {
          label: "+1 Day",
          icon: ArrowRight,
          date: () => new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
        },
        {
          label: "+1 Week",
          icon: Calendar,
          date: () => new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        },
        {
          label: "+1 Month",
          icon: Star,
          date: () => {
            const newDate = new Date(baseDate);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
          }
        }
      ];
    }

    // For first phase, show absolute time options
    return [
      { label: "Now", icon: Zap, date: () => new Date() },
      { label: "Tomorrow", icon: ArrowRight, date: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
      { label: "Next Week", icon: Calendar, date: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { label: "Next Month", icon: Star, date: () => new Date(new Date().setMonth(new Date().getMonth() + 1)) }
    ];
  };

  const quickPresets = getQuickPresets();

  // Format display date
  const formatDisplayDate = (date: Date) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Today at ${formatTime(date)}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${formatTime(date)}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }) + ` at ${formatTime(date)}`;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDateSelect = (date: Date) => {
    const newDate = new Date(date);
    newDate.setHours(selectedHour);
    newDate.setMinutes(selectedMinute);
    setSelectedDate(newDate);

    // Smooth transition to time picker
    setTimeout(() => setMode("time"), 300);
  };

  const handleTimeConfirm = () => {
    onChange(selectedDate);
    setIsOpen(false);
    setMode("date");
  };

  const handleQuickPreset = (presetDate: () => Date) => {
    const date = presetDate();
    setSelectedDate(date);
    onChange(date);
    setIsOpen(false);
  };

  // Smooth scroll for time picker
  const handleHourScroll = (direction: "up" | "down") => {
    const newHour = direction === "up"
      ? (selectedHour + 1) % 24
      : (selectedHour - 1 + 24) % 24;
    setSelectedHour(newHour);
    setIsPM(newHour >= 12);

    const newDate = new Date(selectedDate);
    newDate.setHours(newHour);
    setSelectedDate(newDate);
  };

  const handleMinuteScroll = (direction: "up" | "down") => {
    const newMinute = direction === "up"
      ? (selectedMinute + 5) % 60
      : (selectedMinute - 5 + 60) % 60;
    setSelectedMinute(newMinute);

    const newDate = new Date(selectedDate);
    newDate.setMinutes(newMinute);
    setSelectedDate(newDate);
  };

  const display12Hour = selectedHour === 0 ? 12 : selectedHour > 12 ? selectedHour - 12 : selectedHour;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <label className="text-white/80 text-xs mb-1 block">{label}</label>
      )}

      {/* Main Input Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 rounded-xl",
          "bg-black/40 border border-white/20",
          "text-white text-left",
          "hover:bg-white/5 hover:border-[rgb(163,255,18)]/50",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(163,255,18)]/50",
          "transition-all duration-200",
          "group relative overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgb(163,255,18)]/10">
              <Calendar className="w-4 h-4 text-[rgb(163,255,18)]" />
            </div>
            <span className="font-medium">
              {formatDisplayDate(value)}
            </span>
          </div>
          <Sparkles className="w-4 h-4 text-[rgb(163,255,18)] group-hover:rotate-12 transition-transform" />
        </div>

        {/* Animated gradient border on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-[rgb(163,255,18)]/20 via-transparent to-[rgb(163,255,18)]/20 animate-pulse" />
        </div>
      </button>

      {/* Picker Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute z-50 mt-2",
              "bg-gradient-to-b from-black/95 to-black/90",
              "backdrop-blur-xl",
              "border border-white/20",
              "rounded-2xl shadow-2xl",
              "overflow-hidden",
              "w-full md:w-[380px]",
              "left-0 md:left-auto"
            )}
          >
            {/* Quick Presets - Always visible */}
            <div className="p-4 border-b border-white/10">
              {previousPhaseEnd && phaseIndex > 0 && (
                <div className="mb-3 p-2 bg-[rgb(163,255,18)]/10 rounded-lg border border-[rgb(163,255,18)]/20">
                  <div className="flex items-center gap-2 text-xs text-[rgb(163,255,18)]">
                    <Clock className="w-3 h-3" />
                    <span>
                      Previous phase starts: {previousPhaseEnd.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {quickPresets.map((preset, index) => {
                  const Icon = preset.icon;
                  return (
                    <motion.button
                      key={preset.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleQuickPreset(preset.date)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2",
                        "bg-white/5 hover:bg-[rgb(163,255,18)]/20",
                        "border border-white/10 hover:border-[rgb(163,255,18)]/50",
                        "rounded-xl whitespace-nowrap",
                        "transition-all duration-200",
                        "group"
                      )}
                    >
                      <Icon className="w-3 h-3 text-[rgb(163,255,18)] group-hover:scale-110 transition-transform" />
                      <span className="text-sm text-white/80 group-hover:text-white">
                        {preset.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex p-2 gap-1">
              <button
                onClick={() => setMode("date")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg",
                  "transition-all duration-200",
                  mode === "date"
                    ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border border-[rgb(163,255,18)]/30"
                    : "text-white/60 hover:bg-white/5"
                )}
              >
                <Calendar className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">Date</span>
              </button>
              <button
                onClick={() => setMode("time")}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg",
                  "transition-all duration-200",
                  mode === "time"
                    ? "bg-[rgb(163,255,18)]/20 text-[rgb(163,255,18)] border border-[rgb(163,255,18)]/30"
                    : "text-white/60 hover:bg-white/5"
                )}
              >
                <Clock className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">Time</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === "date" ? (
                <motion.div
                  key="date"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4"
                >
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-white/60" />
                    </button>
                    <h3 className="text-white font-medium">{monthYear}</h3>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-white/60" />
                    </button>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                      <div key={day} className="text-center text-xs text-white/40 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                      if (!day) {
                        return <div key={`empty-${index}`} />;
                      }

                      const isSelected = day.toDateString() === selectedDate.toDateString();
                      const isToday = day.toDateString() === new Date().toDateString();
                      const isDisabled = (minDate && day < minDate) || (maxDate && day > maxDate);

                      return (
                        <motion.button
                          key={day.toISOString()}
                          whileHover={{ scale: isDisabled ? 1 : 1.1 }}
                          whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                          onClick={() => !isDisabled && handleDateSelect(day)}
                          disabled={isDisabled}
                          className={cn(
                            "aspect-square rounded-lg",
                            "flex items-center justify-center",
                            "text-sm transition-all duration-200",
                            "relative overflow-hidden",
                            isDisabled && "opacity-30 cursor-not-allowed",
                            isSelected && !isDisabled && "bg-[rgb(163,255,18)] text-black font-semibold",
                            isToday && !isSelected && !isDisabled && "bg-white/10 text-white",
                            !isSelected && !isToday && !isDisabled && "text-white/70 hover:bg-white/5"
                          )}
                        >
                          {day.getDate()}
                          {isSelected && (
                            <motion.div
                              layoutId="selected-date"
                              className="absolute inset-0 bg-[rgb(163,255,18)] rounded-lg -z-10"
                              transition={{ type: "spring", bounce: 0.2 }}
                            />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="time"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-6"
                >
                  {/* Time Display */}
                  <div className="text-center mb-6">
                    <p className="text-white/60 text-sm mb-2">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="text-5xl font-light text-white">
                      {String(display12Hour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')}
                      <span className="text-2xl ml-2 text-white/60">{isPM ? 'PM' : 'AM'}</span>
                    </div>
                  </div>

                  {/* Time Selectors */}
                  <div className="flex justify-center gap-4 mb-6">
                    {/* Hour Selector */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleHourScroll("up")}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-white/60 rotate-90" />
                      </button>
                      <div
                        ref={hourRef}
                        className="h-32 w-16 overflow-hidden relative"
                      >
                        <div className="flex flex-col items-center py-12">
                          {[...Array(3)].map((_, i) => {
                            const hour = (display12Hour - 1 + i + 12) % 12 || 12;
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "text-2xl transition-all",
                                  i === 1 ? "text-white font-semibold" : "text-white/30"
                                )}
                              >
                                {String(hour).padStart(2, '0')}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleHourScroll("down")}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-white/60 -rotate-90" />
                      </button>
                    </div>

                    {/* Separator */}
                    <div className="flex items-center text-3xl text-white/40">:</div>

                    {/* Minute Selector */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleMinuteScroll("up")}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-white/60 rotate-90" />
                      </button>
                      <div
                        ref={minuteRef}
                        className="h-32 w-16 overflow-hidden relative"
                      >
                        <div className="flex flex-col items-center py-12">
                          {[...Array(3)].map((_, i) => {
                            const minute = (Math.floor(selectedMinute / 5) * 5 - 5 + i * 5 + 60) % 60;
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "text-2xl transition-all",
                                  i === 1 ? "text-white font-semibold" : "text-white/30"
                                )}
                              >
                                {String(minute).padStart(2, '0')}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleMinuteScroll("down")}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-white/60 -rotate-90" />
                      </button>
                    </div>

                    {/* AM/PM Toggle */}
                    <div className="flex flex-col justify-center ml-2">
                      <button
                        onClick={() => {
                          const newHour = isPM ? selectedHour - 12 : selectedHour + 12;
                          setSelectedHour(newHour);
                          setIsPM(!isPM);
                          const newDate = new Date(selectedDate);
                          newDate.setHours(newHour);
                          setSelectedDate(newDate);
                        }}
                        className={cn(
                          "px-3 py-8 rounded-lg",
                          "bg-white/5 hover:bg-white/10",
                          "border border-white/10",
                          "transition-all duration-200"
                        )}
                      >
                        <div className="flex flex-col gap-2">
                          <span className={cn("text-xs", !isPM ? "text-[rgb(163,255,18)]" : "text-white/30")}>
                            AM
                          </span>
                          <span className={cn("text-xs", isPM ? "text-[rgb(163,255,18)]" : "text-white/30")}>
                            PM
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Confirm Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTimeConfirm}
                    className={cn(
                      "w-full py-3 rounded-xl",
                      "bg-gradient-to-r from-[rgb(163,255,18)] to-[rgb(163,255,18)]/80",
                      "text-black font-semibold",
                      "hover:shadow-lg hover:shadow-[rgb(163,255,18)]/20",
                      "transition-all duration-200"
                    )}
                  >
                    Set Time
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}