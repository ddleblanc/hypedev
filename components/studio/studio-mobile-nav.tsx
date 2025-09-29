"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Palette,
  Package,
  Image,
  Activity,
  Menu,
  X,
  Plus,
  TrendingUp,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StudioMobileNavProps {
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}

export function StudioMobileNav({ onMenuToggle, isMenuOpen }: StudioMobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      path: '/studio/dashboard',
      color: 'from-white/20 to-white/10'
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: Palette,
      path: '/studio/projects',
      color: 'from-white/20 to-white/10'
    },
    {
      id: 'collections',
      label: 'Collections',
      icon: Package,
      path: '/studio/collections',
      color: 'from-white/20 to-white/10'
    },
    {
      id: 'nfts',
      label: 'NFTs',
      icon: Image,
      path: '/studio/nfts',
      color: 'from-white/20 to-white/10'
    }
  ];

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      >
        {/* Backdrop blur effect */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl border-t border-white/10" />

        {/* Navigation content */}
        <div className="relative">
          {/* Quick action bar */}
          <div className="absolute -top-16 left-0 right-0 px-4">
            <motion.div
              className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-full p-1 border border-white/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => router.push('/studio/create')}
                className="w-full bg-white/10 hover:bg-white/20 text-white border-0 rounded-full h-10 font-semibold"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Collection
              </Button>
            </motion.div>
          </div>

          {/* Main navigation */}
          <div className="flex items-center justify-between px-2 py-2 safe-area-bottom">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <motion.button
                  key={item.id}
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "relative flex flex-col items-center justify-center px-3 py-2 rounded-xl flex-1 mx-1 transition-all",
                    active ? "bg-white/10" : "hover:bg-white/5"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}

                  <div className="relative">
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-all",
                        active ? "text-white" : "text-white/60"
                      )}
                    />
                    {active && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </div>

                  <span
                    className={cn(
                      "text-[10px] mt-1 font-medium transition-all",
                      active ? "text-white" : "text-white/60"
                    )}
                  >
                    {item.label}
                  </span>
                </motion.button>
              );
            })}

            {/* Menu toggle button */}
            <motion.button
              onClick={onMenuToggle}
              className={cn(
                "relative flex flex-col items-center justify-center px-3 py-2 rounded-xl mx-1 transition-all",
                isMenuOpen ? "bg-white/10" : "hover:bg-white/5"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 90 : 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-white" />
                ) : (
                  <Menu className="w-5 h-5 text-white/60" />
                )}
              </motion.div>
              <span className="text-[10px] mt-1 font-medium text-white/60">
                {isMenuOpen ? 'Close' : 'Menu'}
              </span>
            </motion.button>
          </div>

          {/* Activity indicator */}
          <motion.div
            className="absolute -top-24 right-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/20 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-white/80 font-medium">Studio Active</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}