"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight,
  Home,
  ArrowLeft,
  Crown,
  FolderOpen,
  Layers3,
  Sparkles,
  MoreHorizontal,
  ChevronsLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BreadcrumbItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  isActive?: boolean;
  shortcut?: string;
}

interface SmartBreadcrumbProps {
  items: BreadcrumbItem[];
  onHome?: () => void;
  onBack?: () => void;
  maxItems?: number;
  showBackButton?: boolean;
  showHomeButton?: boolean;
  className?: string;
}

export function SmartBreadcrumb({
  items,
  onHome,
  onBack,
  maxItems = 4,
  showBackButton = true,
  showHomeButton = true,
  className = ""
}: SmartBreadcrumbProps) {
  // Smart truncation - show first item, ellipsis, and last 2-3 items
  const displayItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }

    const first = items[0];
    const last = items.slice(-2); // Last 2 items
    const middle = items.slice(1, -2); // Everything in between

    return [
      first,
      { 
        label: "...", 
        icon: MoreHorizontal, 
        onClick: undefined, 
        isCollapsed: true, 
        collapsedItems: middle 
      } as BreadcrumbItem & { isCollapsed: true; collapsedItems: BreadcrumbItem[] },
      ...last
    ];
  }, [items, maxItems]);

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Smart Back Button */}
        <AnimatePresence>
          {showBackButton && onBack && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="text-xs">
                    Go back to previous level
                    {items[items.length - 2]?.shortcut && (
                      <span className="ml-2 opacity-60">{items[items.length - 2].shortcut}</span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Home Button */}
        <AnimatePresence>
          {showHomeButton && onHome && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onHome}
                    className="flex items-center gap-2 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <Crown className="h-4 w-4" />
                    <span className="hidden md:inline">Studio</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="text-xs">
                    Return to Studio Dashboard
                    <span className="ml-2 opacity-60">⌘ H</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Breadcrumb Items */}
        <div className="flex items-center gap-1">
          <AnimatePresence mode="wait">
            {displayItems.map((item, index) => (
              <motion.div
                key={`${item.label}-${index}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center gap-1"
              >
                {/* Separator */}
                {(index > 0 || showHomeButton || showBackButton) && (
                  <ChevronRight className="h-3 w-3 text-gray-600 flex-shrink-0" />
                )}

                {/* Collapsed Items Dropdown */}
                {'isCollapsed' in item && item.isCollapsed ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1.5 px-2 py-1 h-8 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <div className="px-2 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Navigate to
                      </div>
                      <DropdownMenuSeparator />
                      {'collapsedItems' in item && (item as BreadcrumbItem & { collapsedItems: BreadcrumbItem[] }).collapsedItems.map((collapsedItem: BreadcrumbItem, collapsedIndex: number) => (
                        <DropdownMenuItem
                          key={collapsedIndex}
                          onClick={collapsedItem.onClick}
                          disabled={!collapsedItem.onClick}
                          className="flex items-center gap-3 py-2"
                        >
                          <div className="p-1.5 rounded bg-white/5">
                            {collapsedItem.icon && <collapsedItem.icon className="h-3 w-3 text-blue-400" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm">{collapsedItem.label}</div>
                          </div>
                          {collapsedItem.shortcut && (
                            <div className="text-xs text-gray-500">{collapsedItem.shortcut}</div>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  /* Regular Breadcrumb Item */
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={item.onClick}
                        disabled={!item.onClick || item.isActive}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-all duration-200 group ${
                          item.isActive
                            ? 'text-[rgb(163,255,18)] bg-[rgb(163,255,18)]/10 cursor-default'
                            : item.onClick
                            ? 'text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer'
                            : 'text-gray-500 cursor-default'
                        }`}
                      >
                        {item.icon && (
                          <div className={`transition-transform duration-200 ${
                            !item.isActive && item.onClick ? 'group-hover:scale-110' : ''
                          }`}>
                            <item.icon className={`h-4 w-4 ${
                              item.isActive ? 'text-[rgb(163,255,18)]' : 'text-current'
                            }`} />
                          </div>
                        )}
                        <span className="font-medium truncate max-w-[120px] sm:max-w-[200px]">
                          {item.label}
                        </span>
                        
                        {/* Active Indicator */}
                        {item.isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-1.5 h-1.5 bg-[rgb(163,255,18)] rounded-full"
                          />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <div className="text-xs">
                        {item.isActive ? `Current: ${item.label}` : `Navigate to ${item.label}`}
                        {item.shortcut && (
                          <span className="ml-2 opacity-60">{item.shortcut}</span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick Actions - Context sensitive shortcuts */}
        <div className="flex items-center gap-1 ml-auto">
          <AnimatePresence>
            {items.length > 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => items[0]?.onClick?.()}
                      className="flex items-center gap-1 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                      <span className="hidden lg:inline text-xs">Back to {items[0]?.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <div className="text-xs">
                      Jump back to {items[0]?.label}
                      <span className="ml-2 opacity-60">⌘ ⇧ H</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Keyboard shortcuts hook for breadcrumb navigation
export function useBreadcrumbShortcuts(
  onHome?: () => void,
  onBack?: () => void,
  items?: BreadcrumbItem[]
) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command/Ctrl + H = Home
      if ((event.metaKey || event.ctrlKey) && event.key === 'h' && !event.shiftKey) {
        event.preventDefault();
        onHome?.();
        return;
      }

      // Command/Ctrl + Shift + H = Jump to first item
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'H') {
        event.preventDefault();
        items?.[0]?.onClick?.();
        return;
      }

      // Escape = Back
      if (event.key === 'Escape') {
        event.preventDefault();
        onBack?.();
        return;
      }

      // Command/Ctrl + Left Arrow = Back
      if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowLeft') {
        event.preventDefault();
        onBack?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onHome, onBack, items]);
}
